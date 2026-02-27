from playwright.sync_api import sync_playwright, Browser, Page, BrowserContext
from loguru import logger
from .config import HEADLESS, BROWSER_TYPE, USER_DATA_DIR

class BrowserManager:
    def __init__(self):
        self.playwright = None
        self.context = None # Using persistent context directly

    def start(self):
        logger.info(f"Starting Browser Manager (Persistent Mode) - Type: {BROWSER_TYPE}, Headless: {HEADLESS}")
        logger.info(f"User Data Dir: {USER_DATA_DIR}")
        
        # Ensure User Data Dir is not locked by zombie processes
        # This is a bit aggressive but helps if "Old Client" is stuck
        import shutil
        import os
        if os.path.exists(os.path.join(USER_DATA_DIR, "SingletonLock")):
             try:
                 os.remove(os.path.join(USER_DATA_DIR, "SingletonLock"))
                 logger.warning("Removed stale SingletonLock from User Data Directory.")
             except Exception: pass
        
        # FIX for PyInstaller: Ensure we don't look for bundled browsers if they don't exist
        import os
        import sys
        
        # Optional: Disable searching for bundled browsers if we rely on system ones
        os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "0"

        try:
            logger.info("Initializing Playwright driver...")
            self.playwright = sync_playwright().start()
            logger.info("Playwright driver started.")
        except Exception as e:
            logger.critical(f"Failed to start Playwright driver: {e}")
            # If WinError 2 here, it implies the 'node' executable or driver script is missing from the bundle.
            raise e
        
        launch_args = {
            "headless": HEADLESS,
            "args": ["--no-sandbox", "--disable-setuid-sandbox", "--start-minimized"],
            "user_data_dir": USER_DATA_DIR,
            "viewport": {"width": 1280, "height": 720},
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        if BROWSER_TYPE == 'firefox':
             self.context = self.playwright.firefox.launch_persistent_context(**launch_args)
        elif BROWSER_TYPE == 'webkit':
             self.context = self.playwright.webkit.launch_persistent_context(**launch_args)
        else:
             # Force strict isolation: Always launch new persistent context (No CDP reuse)
             # This prevents attaching to "Old Clients" (zombie processes)
             
             # Attempt 1: Bundled Chromium (standard Playwright)
             try:
                self.context = self.playwright.chromium.launch_persistent_context(**launch_args)
                
                # --- Minimize Browser Window (Windows only) ---
                import os
                if os.name == 'nt' and not HEADLESS:
                    try:
                        import ctypes
                        import time
                        
                        # Give it a moment to render the window
                        time.sleep(1.0)
                        
                        # We need to find the window handle.
                        # Playwright process ID is available? 
                        # This is tricky because the browser process might spawn renderers.
                        # Strategy: Enumerate windows and look for "Chrome" or "Chromium" in title
                        # But that might catch user's other browsers.
                        
                        # Better Strategy: Since we are in strict isolation, assume the top-level window 
                        # that appeared recently is ours.
                        # Or just minimize *all* "Chromium" windows if we are bold (bad idea).
                        
                        # Alternative: Get the PID from playwright browser?
                        # launch_persistent_context returns BrowserContext which doesn't expose PID directly easily?
                        # Actually, self.context.browser is None for persistent context.
                        
                        # Best effort: Use win32gui to FindWindow by title prefix if we knew it.
                        # Playwright usually sets title to current page title.
                        
                        # Let's try to minimize Foreground Window if it popped up?
                        # hwnd = ctypes.windll.user32.GetForegroundWindow()
                        # ctypes.windll.user32.ShowWindow(hwnd, 6) # SW_MINIMIZE = 6
                        
                        # Even better: Iterate all windows, match title
                        def foreach_window(hwnd, lParam):
                            length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
                            buff = ctypes.create_unicode_buffer(length + 1)
                            ctypes.windll.user32.GetWindowTextW(hwnd, buff, length + 1)
                            title = buff.value
                            # If it looks like a browser (default tab title is often "New Tab" or empty or matches target)
                            # This is heuristic.
                            if title and ("Chromium" in title or "Chrome" in title or "New Tab" in title):
                                # Also check process name if possible? psutil needed.
                                # For now, let's just log.
                                pass
                            return True
                        
                        # BUT, strict isolation means we are the only automation running (hopefully).
                        # Let's just minimize the console (already done) and...
                        # Actually, passing "--start-minimized" in args usually works if no user-data-dir conflict.
                        # If that failed, let's try to minimize "everything" that belongs to our process tree?
                        # Too complex.
                        
                        # Let's try the GetForegroundWindow approach immediately after launch, 
                        # as Playwright usually focuses it.
                        hwnd = ctypes.windll.user32.GetForegroundWindow()
                        ctypes.windll.user32.ShowWindow(hwnd, 6) # SW_MINIMIZE
                        logger.info("Attempted to minimize foreground browser window.")
                        
                    except Exception as min_err:
                        logger.warning(f"Failed to minimize browser window: {min_err}")
                # ----------------------------------------------
                
             except Exception as e1:
                logger.warning(f"Failed to launch bundled Chromium: {e1}")
                
                # Attempt 2: System Chrome
                try:
                    logger.info("Trying System Chrome...")
                    chrome_args = launch_args.copy()
                    chrome_args["channel"] = "chrome"
                    self.context = self.playwright.chromium.launch_persistent_context(**chrome_args)
                except Exception as e2:
                    logger.warning(f"Failed to launch System Chrome: {e2}")
                    
                    # Attempt 3: System Edge
                    try:
                        logger.info("Trying System Edge...")
                        edge_args = launch_args.copy()
                        edge_args["channel"] = "msedge"
                        self.context = self.playwright.chromium.launch_persistent_context(**edge_args)
                    except Exception as e3:
                        logger.error("CRITICAL: No robust browser found (Bundled, Chrome, or Edge).")
                        raise e1
            
    def get_page(self) -> Page:
        # Check if context exists but is actually closed (e.g. user closed window manually)
        if self.context:
            try:
                # Lightweight check to see if context is alive. 
                self.context.pages
            except Exception:
                logger.warning("Browser context appears disconnected. Restarting...")
                self.context = None

        if not self.context:
            self.start()
        
        # Double safety: existing context might be broken but passed the check
        try:
            return self.context.new_page()
        except Exception as e:
            logger.warning(f"Error creating new page ({e}). Restarting browser...")
            try: 
                self.close() 
            except: 
                pass
            self.start()
            return self.context.new_page()

    def close(self):
        try:
            if self.context:
                self.context.close()
        except Exception as e:
            logger.warning(f"Error closing context: {e}")
        finally:
            self.context = None
            
        try:
            if self.playwright:
                self.playwright.stop()
        except Exception as e:
             logger.warning(f"Error stopping playwright: {e}")
        finally:
             # Do not set self.playwright to None here if we want to reuse it?
             # But start() creates a new generic one.
             # Ideally we should clean it up.
             self.playwright = None # Force re-init next time
             
        logger.info("Browser Manager Stopped")
