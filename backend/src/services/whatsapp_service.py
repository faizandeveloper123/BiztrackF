import logging
import os
import re
from typing import Any, Dict, Optional, Tuple

import requests

logger = logging.getLogger(__name__)

WHATSAPP_API_URL = "https://botlinkd.com/api/whatsapp/message"
WHATSAPP_TEMPLATE_API_URL = "https://botlinkd.com/api/whatsapp/template"


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
        """Send a free-form WhatsApp message via BotLinkd.

        Free-form messages only work within an open customer-service window
        (after the customer initiated the conversation). For business-initiated
        messages use send_template_message instead.

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
        return self._post(WHATSAPP_API_URL, payload)

    def send_template_message(
        self,
        to_phone: str,
        template: str,
        language: str = "en",
        body_params: Optional[list] = None,
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """Send an approved WhatsApp template via BotLinkd.

        Meta requires approved templates for business-initiated messages
        (outside the 24-hour customer-service window).

        Returns (success, provider_status, error_message).
        """
        phone = self._clean_phone(to_phone)
        if not phone:
            return False, None, "Receiver phone number is required"
        if not self.configured:
            return False, None, "BotLinkd is not configured (set BOTLINKD_APP_KEY and BOTLINKD_AUTH_KEY)"
        if not template:
            return False, None, "Template name is required"

        payload = {
            "appkey": self.app_key,
            "authkey": self.auth_key,
            "to": phone,
            "template": template,
            "language": language or "en",
        }
        if body_params:
            for index, value in enumerate(body_params):
                payload[f"body_params[{index}]"] = str(value or "")
        return self._post(WHATSAPP_TEMPLATE_API_URL, payload)

    def _post(self, url: str, payload: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[str]]:
        try:
            resp = requests.post(url, data=payload, timeout=30)
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