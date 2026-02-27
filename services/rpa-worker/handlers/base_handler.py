from abc import ABC, abstractmethod
from playwright.sync_api import Page
from loguru import logger
from core.api_client import RPAClient

class BaseHandler(ABC):
    def __init__(self, page: Page):
        self.page = page
        self.task_id = None

    def set_task_context(self, task_id):
        self.task_id = task_id

    @abstractmethod
    def run(self, data: dict):
        """
        Execute the automation logic
        :param data: The content/parameters for the task
        """
        pass

    def log(self, message: str, step="Processing", status="info"):
        logger.info(f"[{self.__class__.__name__}] {message}")
        if self.task_id:
            RPAClient.report_log(self.task_id, step, message, status)

    def sleep(self, seconds, reason="Waiting"):
        self.log(f"Sleeping {seconds}s: {reason}", step="Wait", status="pending")
        import time
        time.sleep(seconds)
