from datetime import datetime
from typing import Any, List, Dict
from reportlab.lib import colors


def hex_to_color(hex_color: str):
    hex_color = (hex_color or "").lstrip("#")
    if len(hex_color) != 6:
        return colors.Color(0, 0, 0)
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return colors.Color(r, g, b)


def safe_str(v: Any) -> str:
    if v is None:
        return ""
    return str(v).strip()


def format_date(d: Any) -> str:
    if not d:
        return ""
    if isinstance(d, str):
        try:
            d = datetime.fromisoformat(d.replace("Z", "+00:00"))
        except Exception:
            return d[:16] if len(d) > 16 else d
    if hasattr(d, "strftime"):
        return d.strftime("%d/%m/%Y %H:%M")
    return str(d)


def normalize_items(items: Any) -> List[Dict[str, Any]]:
    if not items:
        return []
    out = []
    for row in (items if isinstance(items, list) else []):
        out.append(row if isinstance(row, dict) else {})
    return out
