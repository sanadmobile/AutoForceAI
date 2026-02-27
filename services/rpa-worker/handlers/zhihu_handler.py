from .base_handler import BaseHandler
import time
from core.config import ZHIHU_COOKIE, HEADLESS

class ZhihuHandler(BaseHandler):
    def check_login(self):
        """Helper to verify login status based on page elements"""
        try:
             # 1. 尝试检测核心 Cookie (z_c0)
             cookies = self.page.context.cookies()
             if any(c['name'] == 'z_c0' and c['value'] for c in cookies):
                 return True

             # 2. 检测 UI 元素
             # 检查头像 (Avatar 类通常很稳定)
             if self.page.locator(".Avatar").count() > 0: return True
             # 检查“写文章/提问”等登录后才有的按钮
             if self.page.get_by_role("button", name="写文章").count() > 0: return True
             if self.page.get_by_role("button", name="提问").count() > 0: return True
             
             # 旧的检测逻辑作为兜底
             if self.page.locator(".AppHeader-userInfo").count() > 0 or \
               self.page.locator(".AppHeader-profile").count() > 0:
                return True
        except:
            pass
        return False

    def run(self, data: dict):
        content = data.get("content", "")
        title = data.get("title", "GEO Insight")
        
        self.log("Navigating to Zhihu...", step="Init")
        
        # 1. 注入 Cookie (核心：绕过登录)
        if ZHIHU_COOKIE:
            self.log("Injecting cookies...", step="Auth")
            try:
                # Basic cleaning if user pasted full header line
                clean_cookie = ZHIHU_COOKIE.replace("Cookie:", "").replace("cookie:", "").strip()
                
                cookies = []
                for cookie in clean_cookie.split(';'):
                    if '=' in cookie:
                        name, value = cookie.strip().split('=', 1)
                        if name and value: 
                            cookies.append({
                                'name': name.strip(), 
                                'value': value.strip(), 
                                'domain': '.zhihu.com', 
                                'path': '/'
                            })
                
                if cookies:
                    self.page.context.add_cookies(cookies)
                    # Log names of cookies injected for debug
                    cookie_names = [c['name'] for c in cookies]
                    self.log(f"Injected {len(cookies)} cookies: {','.join(cookie_names[:3])}...", step="Auth", status="success")
                    
                    # Reload to apply cookies if we are already on the page, or just goto if not
                    if "zhihu.com" in self.page.url:
                        self.page.reload()
                    else:
                        self.page.goto("https://www.zhihu.com/")
                        
                    self.page.wait_for_load_state("domcontentloaded")
            except Exception as e:
                self.log(f"Cookie injection failed: {e}", step="Auth", status="warning")
            
        if "zhihu.com" not in self.page.url:
             self.page.goto("https://www.zhihu.com/")

        # Log content details for debugging
        self.log(f"Processing Task - Title: {title} | Content Len: {len(content)}", step="Init")

        # 2. 检查登录状态
        self.log("Verifying login status...", step="Auth")
        
        # Check login
        if self.check_login():
             self.log("Login detected.", step="Auth", status="success")
        else:
             # Not logged in immediately.
             # If we are NOT headless, give the user a chance to scan QR code
             if not HEADLESS:
                self.log("Automatic login failed. Waiting 60s for MANUAL login (Scan QR Code)...", step="Auth", status="warning")
                
                # Retry loop
                is_manual_success = False
                for i in range(20): # 20 * 3s = 60s
                    time.sleep(3)
                    if self.check_login():
                        self.log("Manual login detected!", step="Auth", status="success")
                        is_manual_success = True
                        break
                    if i % 3 == 0:
                         self.log(f"Waiting for login... ({60 - i*3}s left)", step="Auth", status="pending")
                
                if not is_manual_success:
                    self.log("Manual login timeout.", step="Auth", status="error")
                    return {"status": "failed", "msg": "Login Timeout (Manual)"}
             else:
                self.log("Login failed (Headless mode). Cannot wait for manual input.", step="Auth", status="error")
                return {"status": "failed", "msg": "Login Required (Invalid Cookie)"}

        # 3. 执行发布 (真实动作)
        self.log(f"Starting content creation...", step="Drafting")
        
        try:
            # 点击写回答/提问/写文章 (这里假设直接去写文章或者回答)
            # 简化逻辑：直接点击首页的 "写想法" 或者 "写文章" 或者用户指定的 Question URL
            # 这是一个通用 Demo，尝试点击“写文章”
            
            # 查找入口
            create_btn = self.page.get_by_role("button", name="写文章")
            if create_btn.count() == 0:
                 # 备选：顶部导航栏
                 self.log("Searching for 'Write Article' button...", step="Drafting")
                 create_btn = self.page.locator(".AppHeader-request").get_by_text("写文章")
            
            if create_btn.count() > 0:
                create_btn.click()
                self.log("Entered Editor.", step="Drafting", status="success")
            else:
                 self.log("Could not find 'Write' button. Navigating directly...", step="Drafting", status="warning")
                 self.page.goto("https://zhuanlan.zhihu.com/write")
            
            self.page.wait_for_load_state("networkidle")
            self.sleep(2, "Waiting for editor to load")

            # 定位标题和正文
            # 知乎专栏编辑器：
            # Title: placeholder="请输入标题"
            # Content: .public-DraftEditor-content
            
            self.log("Typing title...", step="Drafting")
            self.page.get_by_placeholder("请输入标题").fill(title)
            
            self.log(f"Typing content... ({len(content)} chars)", step="Drafting")
            
            # 定位编辑器
            editor = self.page.locator(".public-DraftEditor-content")
            if editor.count() == 0:
                self.log("Critical: Editor not found!", step="Drafting", status="error")
                raise Exception("Editor element .public-DraftEditor-content missing")

            editor.click()
            self.sleep(0.5)
            
            # 使用 keyboard.insert_text (Paste-like behavior)
            # 这比 type/press_sequentially 更快且兼容性更好，类似于粘贴操作
            self.log(f"Inserting content ({len(content)} chars)...", step="Drafting")
            try:
                self.page.keyboard.insert_text(content)
            except Exception as e:
                self.log(f"Insert text failed, falling back to fill: {e}", status="warning")
                editor.fill(content)

            # Double check content length
            try:
                # editor is a div/contenteditable, so input_value() will fail. Use inner_text()
                scraped_content = editor.inner_text()
            except:
                scraped_content = ""

            if len(scraped_content) < len(content) * 0.5:
                 self.log(f"Warning: Content mismatch. Editor has {len(scraped_content)} chars.", status="warning")
            
            self.log("Content filled. Waiting for auto-save and URL update...", step="Drafting", status="success")
            
            # 4. 等待保存并获取草稿链接
            # 知乎通常会自动保存，URL 可能会变更为 /p/xxxx/edit
            # URL format expected: https://zhuanlan.zhihu.com/p/12345/edit
            draft_url = self.page.url
            
            # 尝试把焦点移出编辑器（点击标题栏），触发 Autosave
            try:
                self.page.get_by_placeholder("请输入标题").click()
                self.sleep(1)
            except:
                pass

            # 最多等待 30 秒
            found_valid_url = False
            for i in range(30):
                current_url = self.page.url
                # 检查是否包含 /p/ 且包含 /edit (或者是已生成的文章ID格式)
                if "/p/" in current_url and "/edit" in current_url:
                    draft_url = current_url
                    found_valid_url = True
                    self.log(f"Draft saved to ID: {draft_url}", step="Publish", status="success")
                    break
                
                self.sleep(1)
                if i % 5 == 0 and i > 0:
                    self.log(f"Waiting for URL update... current: {current_url[-20:]} ({i}s)", step="Drafting")
            
            # 5. 返回结果 (不直接发布，而是存为草稿)
            msg = "Content saved to Drafts."
            
            if found_valid_url:
                msg += " Ready for confirmation."
            else:
                 msg += " (Warning: URL did not change from generic '/write'. Draft may be saved but link is not specific)."
                 self.log(f"Timeout waiting for URL update. Final URL: {draft_url}", step="Drafting", status="warning")

            return {
                "status": "success",
                "data": {
                    "url": draft_url
                },
                "msg": msg
            }

        except Exception as e:
            self.log(f"Drafting failed: {e}", step="Drafting", status="error")
            # 截图留证
            screenshot_path = f"error_{self.task_id}.png"
            self.page.screenshot(path=screenshot_path)
            self.log(f"Screenshot saved to {screenshot_path}", step="Debug")
            raise e
