import time
import os
import sys
import json
import urllib.parse
import requests
from loguru import logger
import core.config as cfg
from core.browser_manager import BrowserManager
from handlers import get_handler
import ctypes

def minimize_console():
    """Minimizes the console window on Windows."""
    if os.name == 'nt':
        try:
            hwnd = ctypes.windll.kernel32.GetConsoleWindow()
            if hwnd:
                ctypes.windll.user32.ShowWindow(hwnd, 6) # SW_MINIMIZE = 6
        except Exception as e:
            logger.warning(f"Failed to minimize console: {e}")

def run_rpa_worker():
    minimize_console()
    logger.info(f"Starting RPA Worker [{cfg.WORKER_ID}]...")
    logger.info(f"Connecting to Brain Server: {cfg.GEO_SERVER_URL}")
    
    # Initialize Browser Manager Outside the Loop (Persistent Mode)
    browser_manager = BrowserManager()
    
    idle_start_time = time.time()
    # IDLE_TIMEOUT = 120 # Specific timeout removed for Persistent Mode

    while True:
        # browser_mgr is now persistent
        
        try:
            # 1. Poll for tasks
            try:
                # Debug Poll
                # print(".", end="", flush=True) 
                response = requests.get(f"{cfg.GEO_SERVER_URL}/rpa/tasks/pop", headers={"X-Worker-Key": cfg.WORKER_SECRET}, timeout=10)
                if response.status_code != 200:
                    time.sleep(cfg.POLL_INTERVAL)
                    continue
                
                res_data = response.json()
                # Check for empty json {} or None
                if not res_data or "id" not in res_data:
                    time.sleep(cfg.POLL_INTERVAL)
                    continue
                    
                task = res_data
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"Connection error: {e}")
                print(f"[!] Connection Error: {e}")
                time.sleep(cfg.POLL_INTERVAL)
                continue

            logger.info(f"Received Task: {task}")
            print(f"\n[!!!] RECEIVED TASK #{task.get('id')} - TYPE: {task.get('job_type')} / PLATFORM: {task.get('platform')}")
            
            # 2. Process Task
            try:
                print(f"[-] Starting process_task...")
                result = process_task(task, browser_manager)
                print(f"[+] process_task finished.")
            except Exception as task_error:
                 logger.error(f"Critical error in process_task: {task_error}")
                 result = {"status": "failed", "msg": f"Worker Critical Crash: {str(task_error)}"}
            
            # 3. Report Result
            try:
                report_result(task['id'], result)
                logger.info("Result reported successfully.")
            except Exception as e:
                logger.error(f"Failed to report result: {e}")
            
            platform = task.get('platform', '').lower()
            job_type = task.get('job_type', '')
            action = task.get('action', '')
            
            logger.info(f"Task finished for platform: '{platform}' (Type: {job_type}).")
            
            # Logic: 
            # 1. Preview (view_browser) -> Keep Open
            # 2. Publish / Retry -> Auto Close Browser
            
            is_preview = (job_type == 'view_browser') or (action == 'view_only')
            
            if is_preview:
                logger.info(">>> PREVIEW MODE: Browser kept open for user interaction. Manual close required. <<<")
                logger.info("Worker will remain active to maintain browser session.")
                # We continue the loop to keep the process alive
            else:
                logger.info(">>> PUBLISH/RETRY MODE: Auto-closing browser session and RPA Worker. <<<")
                try:
                    browser_manager.close()
                except Exception as e:
                    logger.warning(f"Error closing browser: {e}")
                
                logger.info("Task completed. Exiting RPA Worker (One-Shot Mode).")
                import sys
                sys.exit(0)

            logger.info("Waiting for next task...")
            # Remove 'break' to allow continuous processing

        except KeyboardInterrupt:
            logger.info("Worker stopping...")
            break
        except Exception as e:
            logger.exception(f"Unexpected global error: {e}")
            time.sleep(cfg.POLL_INTERVAL)
    
    try:
        browser_manager.close()
    except: pass
    sys.exit(0)

def process_task(task: dict, browser_mgr: BrowserManager):
    platform = task.get('platform')
    # content = task.get('content')
    
    page = browser_mgr.get_page()
    handler = get_handler(platform, page)
    
    if not handler:
        logger.error(f"No handler found for platform: {platform}")
        page.close()
        return {"status": "failed", "msg": f"Unsupported platform: {platform}"}
    
    try:
        handler.set_task_context(task['id']) # Inject Task ID for live logging
        logger.info(f"Executing handler for {platform}...")
        result = handler.run(task)
        return result
    except Exception as e:
        logger.error(f"Task execution failed: {e}")
        return {"status": "failed", "msg": str(e)}
    finally:
        # Check if we should keep it open (e.g. Xiaohongshu for user interaction)
        should_keep_open = False
        if platform and platform.lower() in ['redbook', 'xiaohongshu']:
            should_keep_open = True

        if not should_keep_open:
            # STRICT CLEANUP: User requests "One Task, One Client/Browser"
            # Always close the browser manager (which closes the window process) after every task.
            try:
                browser_mgr.close() 
                logger.info("Browser session closed (Strict Cleanup).")
            except Exception as e: 
                logger.warning(f"Error closing browser: {e}")
        else:
            logger.info(f"Skipping strict cleanup for {platform} to allow user interaction.")
        
        # Add explicit kill if needed (optional, but requested by user feeling)
        # In strict isolation we rely on browser_mgr shutdown.

def report_result(task_id, result):
    try:
        url = f"{cfg.GEO_SERVER_URL}/rpa/tasks/{task_id}/complete"
        requests.post(url, json=result, headers={"X-Worker-Key": cfg.WORKER_SECRET}, timeout=15)
        logger.info(f"Reported task {task_id} completion.")
    except Exception as e:
        logger.error(f"Failed to report result: {e}")

def register_protocol():
    """
    Registers the 'digitalemployee://' protocol to launch this executable.
    """
    if os.name != 'nt':
        return

    # 允许通过命令行参数强制注册 (方便调试)
    is_frozen = getattr(sys, 'frozen', False)
    force_register = "--register-protocol" in sys.argv
    
    if not is_frozen and not force_register:
        logger.info("Skipping protocol registration (not frozen). Use --register-protocol to force.")
        return 

    protocol = "digitalemployee"
    # 如果是打包环境，sys.executable 是 exe 路径；如果是开发环境，是 python.exe (需配合 worker_main.py 使用)
    exe_path = sys.executable 
    
    # 开发环境修正：注册 python.exe worker_main.py
    command_val = f'"{exe_path}" "%1"'
    if not is_frozen:
         script_path = os.path.abspath(__file__)
         command_val = f'"{exe_path}" "{script_path}" "%1"'

    try:
        import winreg as reg
        print(f"[*] Attempting to register protocol '{protocol}'...")
        
        # Key: HKCU\Software\Classes\digitalemployee
        key_path = f"Software\\Classes\\{protocol}"
        
        with reg.CreateKey(reg.HKEY_CURRENT_USER, key_path) as key:
            reg.SetValue(key, "", reg.REG_SZ, "Digital Employee Protocol")
            reg.SetValueEx(key, "URL Protocol", 0, reg.REG_SZ, "")
            
        # Key: DefaultIcon
        with reg.CreateKey(reg.HKEY_CURRENT_USER, f"{key_path}\\DefaultIcon") as icon_key:
            reg.SetValue(icon_key, "", reg.REG_SZ, f'"{exe_path}",0')

        # Key: ...\shell\open\command
        cmd_key_path = f"{key_path}\\shell\\open\\command"
        with reg.CreateKey(reg.HKEY_CURRENT_USER, cmd_key_path) as cmd_key:
            reg.SetValue(cmd_key, "", reg.REG_SZ, command_val)
            
        print(f"[SUCCESS] Registered protocol: {protocol}:// -> {command_val}")
        logger.info(f"Successfully registered custom protocol: {protocol}://")
    except Exception as e:
        print(f"[ERROR] Registry failed: {e}")
        logger.warning(f"Failed to register protocol: {e}")

if __name__ == "__main__":
    
    # 处理协议唤起参数: digitalemployee://...
    if len(sys.argv) > 1 and sys.argv[1].startswith("digitalemployee://"):
        protocol_url = sys.argv[1]
        logger.info(f"Launched via protocol: {protocol_url}")
        
        try:
            parsed = urllib.parse.urlparse(protocol_url)
            # Check for 'setup' or 'config' command
            # e.g. digitalemployee://setup?id=123&secret=abc
            if parsed.netloc in ["setup", "config"]:
                 query_params = urllib.parse.parse_qs(parsed.query)
                 
                 new_id = query_params.get('id', [None])[0]
                 new_secret = query_params.get('secret', [None])[0]
                 new_url = query_params.get('url', [None])[0]
                 
                 if new_id or new_secret or new_url:
                     appdata_dir = os.path.join(os.environ.get('APPDATA', '.'), 'DigitalEmployee')
                     if not os.path.exists(appdata_dir):
                         os.makedirs(appdata_dir, exist_ok=True)
                     
                     config_file = os.path.join(appdata_dir, "config.json")
                     current_conf = {}
                     if os.path.exists(config_file):
                         try:
                             with open(config_file, 'r', encoding='utf-8') as f:
                                 current_conf = json.load(f)
                         except: pass
                     
                     if new_id: current_conf['WORKER_ID'] = new_id
                     if new_secret: current_conf['WORKER_SECRET'] = new_secret
                     if new_url: current_conf['GEO_SERVER_URL'] = new_url
                     
                     with open(config_file, 'w', encoding='utf-8') as f:
                         json.dump(current_conf, f, indent=4)
                     
                     logger.info(f"Configuration updated via protocol: {config_file}")
                     
                     # Hot-reload in memory config
                     cfg.WORKER_ID = current_conf.get('WORKER_ID', cfg.WORKER_ID)
                     cfg.WORKER_SECRET = current_conf.get('WORKER_SECRET', cfg.WORKER_SECRET)
                     cfg.GEO_SERVER_URL = current_conf.get('GEO_SERVER_URL', cfg.GEO_SERVER_URL)
        except Exception as e:
            logger.error(f"Error parsing protocol arguments: {e}")

    # Register protocol on startup
    register_protocol()

    # Client Mode Guide
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--install-browsers":
         from playwright.sync_api import sync_playwright
         # This is a hacky way to trigger install; better use 'playwright install' CLI
         import subprocess
         subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
         sys.exit(0)

    run_rpa_worker()
