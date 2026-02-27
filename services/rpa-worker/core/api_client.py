import requests
from loguru import logger
from .config import GEO_SERVER_URL, WORKER_SECRET

class RPAClient:
    @staticmethod
    def report_log(task_id: int, step: str, message: str, status: str = "info"):
        """
        Send a real-time log update to the central brain.
        """
        try:
            url = f"{GEO_SERVER_URL}/rpa/tasks/{task_id}/log"
            payload = {
                "step": step,
                "message": message,
                "status": status
            }
            resp = requests.post(url, json=payload, headers={"X-Worker-Key": WORKER_SECRET}, timeout=10)
            if resp.status_code != 200:
                logger.warning(f"Server rejected log: {resp.status_code} - {resp.text}")
        except Exception as e:
            logger.warning(f"Failed to send log to server: {e}")

    @staticmethod
    def report_complete(task_id: int, result: dict):
        try:
            url = f"{GEO_SERVER_URL}/rpa/tasks/{task_id}/complete"
            requests.post(url, json=result, headers={"X-Worker-Key": WORKER_SECRET}, timeout=15)
            logger.info(f"Reported task {task_id} completion.")
        except Exception as e:
            logger.error(f"Failed to report result: {e}")
