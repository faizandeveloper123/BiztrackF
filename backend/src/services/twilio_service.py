import os
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


class TwilioService:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER", "")
        self.webhook_base = os.getenv("TWILIO_WEBHOOK_BASE_URL", "")

    @property
    def configured(self) -> bool:
        return bool(self.account_sid and self.auth_token and self.phone_number)

    def _client(self):
        if not self.configured:
            return None
        try:
            from twilio.rest import Client
            return Client(self.account_sid, self.auth_token)
        except ImportError:
            logger.error("twilio package not installed")
            return None
        except Exception as e:
            logger.error(f"Twilio client error: {e}")
            return None

    def send_sms(self, to_phone: str, body: str) -> Tuple[bool, Optional[str], Optional[str]]:
        if not self.configured:
            return False, None, "Twilio is not configured"
        client = self._client()
        if not client:
            return False, None, "Twilio client unavailable"
        try:
            msg = client.messages.create(
                body=body,
                from_=self.phone_number,
                to=to_phone,
            )
            return True, msg.sid, None
        except Exception as e:
            logger.error(f"Twilio SMS failed: {e}")
            return False, None, str(e)

    def initiate_call(self, to_phone: str, twiml_url: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str]]:
        if not self.configured:
            return False, None, "Twilio is not configured"
        client = self._client()
        if not client:
            return False, None, "Twilio client unavailable"
        try:
            url = twiml_url or f"{self.webhook_base.rstrip('/')}/crm/leads/twilio/voice"
            call = client.calls.create(
                to=to_phone,
                from_=self.phone_number,
                url=url,
            )
            return True, call.sid, None
        except Exception as e:
            logger.error(f"Twilio call failed: {e}")
            return False, None, str(e)


twilio_service = TwilioService()
