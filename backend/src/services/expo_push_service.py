import os
import logging
from typing import Any, Dict, List, Optional

import requests
from sqlalchemy.orm import Session

from ..config.mobile_push_crud import get_push_tokens_for_user

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _chunked(items: List[dict], size: int) -> List[List[dict]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def send_expo_push_to_user(
    db: Session,
    user_id: str,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
) -> None:
    tokens = get_push_tokens_for_user(db, user_id)
    if not tokens:
        return
    payload_data = data if data is not None else {}
    messages: List[dict] = []
    for t in tokens:
        messages.append(
            {
                "to": t,
                "title": title[:200] if title else "",
                "body": (body or "")[:800],
                "data": payload_data,
                "sound": "default",
                "priority": "high",
                "channelId": "default",
            }
        )
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    access_token = os.getenv("EXPO_ACCESS_TOKEN")
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    for batch in _chunked(messages, 100):
        try:
            r = requests.post(
                EXPO_PUSH_URL,
                json=batch,
                headers=headers,
                timeout=30,
            )
            if r.status_code >= 400:
                logger.warning(
                    "Expo push non-success: %s %s",
                    r.status_code,
                    r.text[:500],
                )
        except Exception as e:
            logger.warning("Expo push failed: %s", e, exc_info=True)
