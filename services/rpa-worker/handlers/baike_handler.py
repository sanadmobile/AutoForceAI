from .base_handler import BaseHandler
import time

class BaikeHandler(BaseHandler):
    def run(self, data: dict):
        title = data.get("title", "")
        content = data.get("content", "")
        
        target_url = "https://baike.baidu.com/"
        
        self.log(f"正在初始化百度百科环境...")
        self.log(f"正在访问 {target_url}...")
        
        try:
            self.page.goto(target_url, timeout=20000)
            self.page.wait_for_timeout(3000)
        except Exception as e:
            self.log(f"导航失败: {e}")
            return {"status": "failed", "msg": f"访问失败: {e}"}

        # Check Login Status
        # Baidu usually has a user-name or avatar when logged in.
        # Common selector for logged in user info top right: #user-name or .user-name or .login-link vs .user-center
        # We can look for "登录" button to verify WE ARE NOT LOGGED IN.
        
        is_logged_in = False
        try:
            # If "登录" (Login) button is visible, we are NOT logged in.
            # Selectors might vary, checking for common login classes or text.
            login_btn = self.page.locator("text='登录'")
            if login_btn.count() > 0 and login_btn.first.is_visible():
                is_logged_in = False
            else:
                layout_user = self.page.locator("#user-info, .user-name")
                if layout_user.count() > 0:
                     is_logged_in = True
                else:
                    # Fallback check
                    page_text = self.page.content()
                    if "个人中心" in page_text or "退出" in page_text:
                        is_logged_in = True
        except:
             pass

        if not is_logged_in:
            self.log("[-] 未检测到登录，尝试打开登录弹窗...")
            
            # Helper: Try to click login button to help user
            try:
                # Strategy 1: "登录" text button (most common on Baidu)
                login_texts = self.page.get_by_text("登录")
                if login_texts.count() > 0 and login_texts.first.is_visible():
                    login_texts.first.click()
                    self.log("[+] 已点击 '登录' 按钮")
                else:
                    # Strategy 2: Common header selectors
                    login_link = self.page.locator(".login-link, #u1 a[name='tj_login'], .user-login")
                    if login_link.count() > 0:
                        login_link.first.click()
                        self.log("[+] 已点击顶部登录链接")
            except Exception as e:
                self.log(f"[*] 自动点击登录失败: {e}，请手动点击。")

            self.log("[-] 等待手动登录 (无限等待直到成功)...")
            
            # Helper to check login status
            def check_login():
                try:
                    # 1. URL Check: User centers or Edit pages implies login
                    if any(x in self.page.url for x in ["/user", "/create", "/submit", "/update"]):
                        return True
                    
                    # 2. Positive Text/Element Indicators (Prioritize these)
                    # "退出" (Logout), "我的百科" (My Baike), "个人中心" (User Center)
                    if self.page.get_by_text("退出").first.is_visible(): return True
                    if self.page.get_by_text("我的百科").first.is_visible(): return True
                    if self.page.locator(".user-name, #user-name, .user-icon, .kaifang-header-user").first.is_visible(): return True
                    
                    # 3. Negative Indicator (Fallback)
                    # If "登录" is NOT visible, but the page is heavily loaded (has title/footer), assume logged in.
                    # This fixes cases where we can't find the specific user element ID.
                    login_buttons = self.page.get_by_text("登录")
                    is_login_visible = False
                    for i in range(login_buttons.count()):
                        if login_buttons.nth(i).is_visible():
                            is_login_visible = True
                            break
                    
                    if not is_login_visible:
                         # Ensure page is actually loaded (has "百度百科" logo or title)
                         if self.page.locator("title").count() > 0:
                             return True

                except:
                    pass
                return False

            # Wait loop: Infinite until success or task cancelled externally
            wait_cycle = 0
            while True:
                if check_login():
                     is_logged_in = True
                     self.log("[+] 检测到手动登录成功！")
                     break
                
                if wait_cycle % 10 == 0: # Log every 20s
                     self.log(f"正在等待百度百科登录... (请扫码或输入密码)")

                try:
                    time.sleep(2)
                except KeyboardInterrupt:
                    return {"status": "failed", "msg": "任务被人为中断"}
                
                wait_cycle += 1
                # No timeout return here. We just wait.

        self.log("[+] 登录状态确认，正在跳转至词条编辑页...")
        
        # Baike creation is complex (searching, clicking "Create", standard editor).
        # For now, we'll navigate to the creation page.
        # Fixed: Don't force navigation if we are already selecting a lemma
        if "baike.baidu.com/create" not in self.page.url:
             create_url = "https://baike.baidu.com/create/edit/"
             self.page.goto(create_url)
             self.page.wait_for_timeout(5000)
        
        # Check if we are really on edit page
        if "login" in self.page.url:
             return {"status": "failed", "msg": "重定向回登录页，登录可能失效"}

        self.log(f"正在输入词条标题: {title}...")
        
        self.log(f"正在输入词条标题: {title}...")
        
        # 1. CATEGORY SELECTION CHECK (HIGH PRIORITY)
        # If we are seemingly on a category selection page (no inputs, just options), handle it first.
        try:
             # Fast check for "Technology" text
             if self.page.get_by_text("科技").first.is_visible() and self.page.get_by_text("确定").first.is_visible():
                  self.log("[-] 检测到分类选择界面 (优先处理)...")
                  
                  # Click "科技"
                  self.page.get_by_text("科技").first.click()
                  self.page.wait_for_timeout(500)
                  self.log("[+] 已点击 '科技'")
                  
                  # Click "软件" (Software)
                  # Sometimes needs scroll or expansion
                  if self.page.get_by_text("软件").count() > 0:
                       self.page.get_by_text("软件").first.click()
                       self.log("[+] 已点击 '软件'")
                       self.page.wait_for_timeout(500)
                  
                  # Click "确定"
                  self.page.get_by_text("确定").first.click()
                  self.log("[+] 已点击 '确定'")
                  self.page.wait_for_timeout(3000)
        except: 
             pass

        # 2. Attempt to fill title if the input box is obvious
        try:
            # Common input for new Lemma
            lemma_input = self.page.locator("input#lemma-title, input[name='lemmaTitle'], input.lemma-search-input")
            if lemma_input.count() > 0 and lemma_input.first.is_visible():
                lemma_input.first.fill(title)
                self.log("[+] 已自动填写词条标题")
                
                # Check for Search Button if needed
                search_btn = self.page.locator("#search-lemma, .lemma-search-btn, #enterLemma").first
                if search_btn.count() > 0 and search_btn.is_visible():
                     search_btn.click()
                     self.page.wait_for_timeout(2000)
            else:
                self.log("[-] (步骤2) 未检测到标题输入框")

        except Exception as e:
            self.log(f"[!] 标题输入步骤异常: {e}")

        # 3. CATEGORY SELECTION CHECK (RETRY/NORMAL FLOW)
        # Move this OUTSIDE the input check so it runs even if we are already on the category page
        try:
             self.log("[-] 检查是否需要分类选择 (科技->软件)...")
             
             # Give page a moment if we just clicked search
             self.page.wait_for_timeout(2000)
             
             # Check if "Technology" is visible
             # Improving selector to avoid header links
             # Usually in a dialog or .category-list
             if self.page.locator("text='请选择词条类型'").count() > 0 or \
                self.page.locator(".category-list").count() > 0 or \
                self.page.get_by_text("科技").first.is_visible():
                 
                 self.log("[-] 检测到分类选择界面，正在操作...")
                 
                 # 1. Click "科技" (Technology)
                 # Use a specific locator if possible, or text
                 tech_btn = self.page.locator("li:has-text('科技'), div:has-text('科技')").filter(has_text="科技").last
                 # Fallback to simple text
                 if not tech_btn.is_visible():
                      tech_btn = self.page.get_by_text("科技").first
                 
                 if tech_btn.is_visible():
                      tech_btn.click()
                      self.page.wait_for_timeout(1000)
                      self.log("[+] 已点击 '科技'")
                 
                 # 2. Click "软件" (Software)
                 # This might appear dynamically
                 soft_btn = self.page.locator("li:has-text('软件'), span:has-text('软件')").first
                 if not soft_btn.is_visible():
                      soft_btn = self.page.get_by_text("软件").first
                      
                 if soft_btn.is_visible():
                      soft_btn.click()
                      self.page.wait_for_timeout(500)
                      self.log("[+] 已点击 '软件'")
                 else:
                      self.log("[!] 未找到 '软件' 选项，尝试直接确认")

                 # 3. Click "确定" (Confirm)
                 confirm_btn = self.page.locator("button:has-text('确定'), .confirm-btn").filter(has_text="确定").first
                 if not confirm_btn.is_visible():
                      confirm_btn = self.page.get_by_text("确定").last
                      
                 if confirm_btn.is_visible():
                      confirm_btn.click()
                      self.log("[+] 已点击 '确定'")
                      self.page.wait_for_timeout(3000)
                 else:
                      self.log("[!] 未找到 '确定' 按钮")
             else:
                 self.log("[-] 未检测到明显的分类选择弹窗，跳过此步")

        except Exception as cat_e:
             self.log(f"[*] 分类选择非致命错误: {cat_e}")

        # ENTER CONTENT & POYSEMY (義項名)
        try:
             self.log("[-] 正在填写义项名与正文...")
             
             # Polysemy Name (义项名) - User requested to use Title here
             # Usually an input distinct from title
             poly_input = self.page.locator("input[placeholder*='义项'], input.lemma-desc").first
             if poly_input.count() > 0 and poly_input.is_visible():
                  poly_input.click()
                  poly_input.fill(title) 
                  self.log(f"[+] 已填写义项名 (标题): {title}")
             else:
                  self.log("[!] 未找到义项名输入框")
             
             # Main Content (正文)
             # Baike editor is usually complex. Try raw body text entry if possible.
             # Or finding the first paragraph editor.
             # ".para-editor" or similar
             editor = self.page.locator(".edui-body-container, div[contenteditable='true']").first
             if editor.count() > 0:
                  editor.click()
                  # Use content from task
                  editor.fill(content) 
                  self.log("[+] 已填写正文摘要")
        except Exception as e:
             self.log(f"[!] 内容填写部分失败 (需手动补充): {e}")

        # SAVE DRAFT (存草稿)
        try:
             self.log("[-] 尝试保存草稿...")
             save_btn = self.page.locator("text='存草稿'").first
             if save_btn.count() > 0 and save_btn.is_visible():
                  save_btn.click()
                  self.log("[+] 已点击 '存草稿'")
                  self.page.wait_for_timeout(3000)
             else:
                  # Maybe already saved or button text different?
                  # Try to continue to preview anyway as user requested specific flow
                  self.log("[!] 未找到 '存草稿' 按钮 (可能已自动保存或无需保存)")
        except Exception as e:
             self.log(f"[!] 保存草稿失败: {e}")

        # REFINED LINK RETRIEVAL FLOW (REQUESTED STRICT PATH)
        # 1. Preview (预览) -> 2. Baike Home (百度百科) -> 3. User Center (个人中心) -> 4. Drafts (草稿箱) -> 5. Edit (继续编辑)
        persistent_url = self.page.url # fallback
        try:
             self.log("[-] 开始执行链接获取流程 (预览 -> 个人中心 -> 草稿箱)...")
             
             # STEP 1: Click Preview (预览)
             preview_btn = self.page.locator("a:has-text('预览'), button:has-text('预览')").first
             if preview_btn.is_visible():
                  with self.page.context.expect_page() as preview_page_info:
                       preview_btn.click()
                  preview_page = preview_page_info.value
                  preview_page.wait_for_load_state()
                  self.log("[+] 已进入预览页面")
                  self.page.wait_for_timeout(2000)
                  
                  # OLD MANUAL PATH: Preview -> Baike Text Link -> User Center -> Lemmas -> Drafts
                  # NEW PATH (Requested): Preview -> Direct URL to Drafts (https://baike.baidu.com/usercenter/lemmas#drafts)
                  
                  self.log("[-] 直接跳转到草稿箱列表...")
                  preview_page.goto("https://baike.baidu.com/usercenter/lemmas#drafts")
                  preview_page.wait_for_load_state()
                  self.log("[+] 已跳转至草稿箱页面")
                  preview_page.wait_for_timeout(2000)

                  # STEP 3: Click "Continue Editing" (继续编辑) on the most recent ONE
                  # The list is usually sorted by time desc.
                  # Look for first "继续编辑"
                  edit_link = preview_page.locator("a:has-text('继续编辑')").first
                  if edit_link.is_visible():
                        # This usually opens the editor in the same tab or new tab?
                        # Let's handle both.
                        # If it opens new tab:
                        try:
                            with preview_page.context.expect_page(timeout=5000) as edit_page_info:
                                  edit_link.click()
                            edit_page = edit_page_info.value
                            edit_page.wait_for_load_state()
                            persistent_url = edit_page.url
                            edit_page.close() # Close the new editor tab
                        except:
                            # Maybe opened in same tab
                            persistent_url = preview_page.url
                            
                        self.log(f"[+] 成功获取编辑链接: {persistent_url}")
                  else:
                        self.log("[!] 未找到 '继续编辑' 按钮")

                  # Cleanup: Close the preview/nav tab, original page will be closed by worker_main
                  preview_page.close()
                  
             else:
                  self.log("[!] 页面上未找到 '预览' 按钮")
             
        except Exception as e:
             self.log(f"[!] 获取永久链接流程异常: {e}")

        self.log("[+] 百度词条自动化流程结束。")

        return {
            "status": "success",
            "msg": f"百度词条已创建草稿 (可编辑) |||LINK:{persistent_url}|||"
        }
