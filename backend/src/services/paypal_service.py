import base64
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)


class PayPalService:
    def __init__(self):
        self.client_id = os.getenv("PAYPAL_CLIENT_ID")
        self.client_secret = os.getenv("PAYPAL_CLIENT_SECRET")
        self.mode = os.getenv("PAYPAL_MODE", "sandbox").lower()
        self.webhook_id = os.getenv("PAYPAL_WEBHOOK_ID")
        self.currency = os.getenv("PAYPAL_CURRENCY", "USD").upper()
        self.base_url = (
            "https://api-m.sandbox.paypal.com"
            if self.mode == "sandbox"
            else "https://api-m.paypal.com"
        )
        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def _get_access_token(self) -> str:
        if (
            self._access_token
            and self._token_expires_at
            and datetime.utcnow() < self._token_expires_at
        ):
            return self._access_token

        if not self.is_configured():
            raise ValueError("PayPal credentials are not configured")

        auth = base64.b64encode(
            f"{self.client_id}:{self.client_secret}".encode()
        ).decode()
        response = requests.post(
            f"{self.base_url}/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"grant_type": "client_credentials"},
            timeout=30,
        )
        if response.status_code == 401:
            mode_hint = "sandbox" if self.mode == "sandbox" else "live"
            raise ValueError(
                f"PayPal authentication failed ({mode_hint} API). "
                "Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are from the same "
                f"PayPal REST app and PAYPAL_MODE={self.mode} matches that app."
            )
        response.raise_for_status()
        data = response.json()
        self._access_token = data["access_token"]
        expires_in = int(data.get("expires_in", 3600))
        self._token_expires_at = datetime.utcnow() + timedelta(seconds=max(expires_in - 60, 60))
        return self._access_token

    def _request(
        self,
        method: str,
        path: str,
        payload: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        token = self._get_access_token()
        response = requests.request(
            method,
            f"{self.base_url}{path}",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=payload,
            params=params,
            timeout=30,
        )
        if not response.ok:
            logger.error("PayPal API error %s %s: %s", method, path, response.text)
            response.raise_for_status()
        if response.text:
            return response.json()
        return {}

    def _billing_interval(self, billing_cycle: str) -> Dict[str, Any]:
        if billing_cycle.lower() == "yearly":
            return {"interval_unit": "YEAR", "interval_count": 1}
        return {"interval_unit": "MONTH", "interval_count": 1}

    def create_product(self, name: str, description: str) -> str:
        result = self._request(
            "POST",
            "/v1/catalogs/products",
            {
                "name": name[:127],
                "description": description[:256],
                "type": "SERVICE",
                "category": "SOFTWARE",
            },
        )
        return result["id"]

    def create_billing_plan(
        self,
        product_id: str,
        plan_name: str,
        plan_price: float,
        billing_cycle: str,
    ) -> str:
        result = self._request(
            "POST",
            "/v1/billing/plans",
            {
                "product_id": product_id,
                "name": plan_name[:127],
                "description": f"BizTrack {plan_name} subscription",
                "status": "ACTIVE",
                "billing_cycles": [
                    {
                        "frequency": self._billing_interval(billing_cycle),
                        "tenure_type": "REGULAR",
                        "sequence": 1,
                        "total_cycles": 0,
                        "pricing_scheme": {
                            "fixed_price": {
                                "value": f"{plan_price:.2f}",
                                "currency_code": self.currency,
                            }
                        },
                    }
                ],
                "payment_preferences": {
                    "auto_bill_outstanding": True,
                    "setup_fee_failure_action": "CONTINUE",
                    "payment_failure_threshold": 3,
                },
            },
        )
        plan_id = result["id"]
        if result.get("status") == "CREATED":
            self._request("POST", f"/v1/billing/plans/{plan_id}/activate")
        return plan_id

    def ensure_plan_active(self, paypal_plan_id: str) -> None:
        plan = self.get_billing_plan(paypal_plan_id)
        if plan.get("status") == "CREATED":
            self._request("POST", f"/v1/billing/plans/{paypal_plan_id}/activate")
        elif plan.get("status") != "ACTIVE":
            raise ValueError(
                f"PayPal plan {paypal_plan_id} has status {plan.get('status')}, expected ACTIVE"
            )

    def ensure_billing_plan(
        self,
        plan_id: str,
        plan_name: str,
        plan_price: float,
        billing_cycle: str,
        existing_paypal_plan_id: Optional[str],
    ) -> str:
        if existing_paypal_plan_id:
            try:
                plan = self.get_billing_plan(existing_paypal_plan_id)
                status = plan.get("status")
                if status == "ACTIVE":
                    return existing_paypal_plan_id
                if status == "CREATED":
                    self.ensure_plan_active(existing_paypal_plan_id)
                    return existing_paypal_plan_id
            except Exception:
                logger.warning("Stored PayPal plan %s invalid, recreating", existing_paypal_plan_id)

        product_id = self.create_product(
            f"BizTrack {plan_name}",
            f"BizTrack {plan_name} subscription",
        )
        return self.create_billing_plan(
            product_id=product_id,
            plan_name=plan_name,
            plan_price=plan_price,
            billing_cycle=billing_cycle,
        )

    def get_billing_plan(self, paypal_plan_id: str) -> Dict[str, Any]:
        return self._request("GET", f"/v1/billing/plans/{paypal_plan_id}")

    def create_subscription(
        self,
        paypal_plan_id: str,
        tenant_id: str,
        plan_id: str,
        success_url: str,
        cancel_url: str,
    ) -> Dict[str, Any]:
        try:
            result = self._request(
                "POST",
                "/v1/billing/subscriptions",
                {
                    "plan_id": paypal_plan_id,
                    "custom_id": f"{tenant_id}:{plan_id}",
                    "application_context": {
                        "brand_name": "BizTrack",
                        "locale": "en-US",
                        "shipping_preference": "NO_SHIPPING",
                        "user_action": "SUBSCRIBE_NOW",
                        "return_url": success_url,
                        "cancel_url": cancel_url,
                    },
                },
            )
            approve_url = next(
                (link["href"] for link in result.get("links", []) if link.get("rel") == "approve"),
                None,
            )
            if not approve_url:
                return {"success": False, "error": "PayPal approval URL not returned"}
            return {
                "success": True,
                "subscription_id": result["id"],
                "url": approve_url,
                "status": result.get("status"),
            }
        except Exception as exc:
            logger.error("PayPal subscription creation failed: %s", exc)
            return {"success": False, "error": str(exc)}

    def get_subscription(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        try:
            result = self._request("GET", f"/v1/billing/subscriptions/{subscription_id}")
            billing_info = result.get("billing_info") or {}
            next_billing = billing_info.get("next_billing_time")
            end_date = None
            if next_billing:
                end_date = datetime.fromisoformat(next_billing.replace("Z", "+00:00")).replace(tzinfo=None)
            return {
                "id": result.get("id"),
                "status": (result.get("status") or "").lower(),
                "custom_id": result.get("custom_id"),
                "current_period_end": end_date,
            }
        except Exception as exc:
            logger.error("PayPal get subscription failed: %s", exc)
            return None

    def activate_subscription(self, subscription_id: str) -> bool:
        try:
            self._request("POST", f"/v1/billing/subscriptions/{subscription_id}/activate")
            return True
        except Exception as exc:
            logger.warning("PayPal activate subscription failed: %s", exc)
            return False

    def cancel_subscription(self, subscription_id: str, reason: str = "Customer requested cancellation") -> bool:
        try:
            self._request(
                "POST",
                f"/v1/billing/subscriptions/{subscription_id}/cancel",
                {"reason": reason[:128]},
            )
            return True
        except Exception as exc:
            logger.error("PayPal cancel subscription failed: %s", exc)
            return False

    def verify_webhook(self, headers: Dict[str, str], body: bytes) -> Optional[Dict[str, Any]]:
        if not self.webhook_id:
            logger.warning("PAYPAL_WEBHOOK_ID not configured, skipping webhook verification")
            try:
                return json.loads(body.decode("utf-8"))
            except ValueError:
                return None

        try:
            event = json.loads(body.decode("utf-8"))
            verification = self._request(
                "POST",
                "/v1/notifications/verify-webhook-signature",
                {
                    "auth_algo": headers.get("paypal-auth-algo"),
                    "cert_url": headers.get("paypal-cert-url"),
                    "transmission_id": headers.get("paypal-transmission-id"),
                    "transmission_sig": headers.get("paypal-transmission-sig"),
                    "transmission_time": headers.get("paypal-transmission-time"),
                    "webhook_id": self.webhook_id,
                    "webhook_event": event,
                },
            )
            if verification.get("verification_status") == "SUCCESS":
                return event
            logger.error("PayPal webhook verification failed: %s", verification)
            return None
        except Exception as exc:
            logger.error("PayPal webhook verification error: %s", exc)
            return None


paypal_service = PayPalService()
