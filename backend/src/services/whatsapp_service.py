import logging
import os
import re
from typing import Any, Dict, Optional, Tuple

import requests

logger = logging.getLogger(__name__)

WHATSAPP_API_URL = "https://botlinkd.com/api/whatsapp/message"


class WhatsAppService:
    def __init__(self) -> None:
        self.app_key = os.getenv("BOTLINKD_APP_KEY", "")
        self.auth_key = os.getenv("BOTLINKD_AUTH_KEY", "")

    @property
    def configured(self) -> bool:
        return bool(self.app_key and self.auth_key)

    def _clean_phone(self, phone: str) -> str:
        cleaned = re.sub(r"[^0-9+]", "", str(phone or "")).strip()
        if cleaned.startswith("+"):
            cleaned = cleaned[1:]
        return cleaned

    def send_message(self, to_phone: str, message: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """Send a WhatsApp message via BotLinkd.

        Returns (success, provider_status, error_message).
        """
        phone = self._clean_phone(to_phone)
        if not phone:
            return False, None, "Receiver phone number is required"
        if not self.configured:
            return False, None, "BotLinkd is not configured (set BOTLINKD_APP_KEY and BOTLINKD_AUTH_KEY)"

        payload = {
            "appkey": self.app_key,
            "authkey": self.auth_key,
            "to": phone,
            "message": message,
        }

        try:
            resp = requests.post(
                WHATSAPP_API_URL,
                data=payload,
                timeout=30,
            )
        except requests.RequestException as e:
            logger.error("BotLinkd request failed: %s", e)
            return False, None, f"BotLinkd request failed: {e}"

        try:
            data = resp.json()
        except ValueError:
            data = {"raw": resp.text}

        status = data.get("status")
        if resp.status_code >= 400 or (status and str(status).lower() != "success"):
            detail = data.get("data") or data.get("message") or data.get("detail") or data.get("raw")
            logger.error("BotLinkd send failed (%s): %s", resp.status_code, data)
            return False, str(resp.status_code), str(detail or "Unknown BotLinkd error")

        provider = data.get("data") or {}
        return True, str(provider.get("status_code", "200")), None


whatsapp_service = WhatsAppService()