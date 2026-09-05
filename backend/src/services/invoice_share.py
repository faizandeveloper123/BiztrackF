import os
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict

import jwt
from fastapi import HTTPException, status
from fastapi.responses import Response
from sqlalchemy import and_
from sqlalchemy.orm import Session

from ..core.auth import SECRET_KEY, ALGORITHM
from ..models.invoices import Invoice, InvoiceShareLink

INVOICE_SHARE_EXPIRE_DAYS = int(os.getenv("INVOICE_SHARE_EXPIRE_DAYS", "90"))


def get_share_base_url() -> str:
    return (
        os.getenv("INVOICE_SHARE_BASE_URL")
        or os.getenv("FRONTEND_URL")
        or os.getenv("APP_PUBLIC_URL")
        or "https://biztrack.uk"
    ).rstrip("/")


def public_invoice_short_url(code: str) -> str:
    return f"{get_share_base_url()}/i/{code}"


def create_invoice_share_token(invoice_id: str, tenant_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=INVOICE_SHARE_EXPIRE_DAYS)
    payload = {
        "invoice_id": str(invoice_id),
        "tenant_id": str(tenant_id),
        "type": "invoice_share",
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_invoice_share_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invoice link has expired",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid invoice link",
        )

    if payload.get("type") != "invoice_share":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid invoice link",
        )
    return payload


def public_invoice_pdf_url(invoice_id: str, token: str) -> str:
    base = (
        os.getenv("API_PUBLIC_URL")
        or os.getenv("PUBLIC_API_URL")
        or os.getenv("NEXT_PUBLIC_API_URL")
        or "http://localhost:8000"
    ).rstrip("/")
    return f"{base}/public/invoices/{invoice_id}/pdf?token={token}"


def _generate_share_code() -> str:
    return secrets.token_urlsafe(6)


def create_or_get_invoice_share_code(
    db: Session, invoice_id: str, tenant_id: str
) -> str:
    now = datetime.utcnow()
    existing = (
        db.query(InvoiceShareLink)
        .filter(
            and_(
                InvoiceShareLink.invoice_id == invoice_id,
                InvoiceShareLink.tenant_id == tenant_id,
                InvoiceShareLink.expires_at > now,
            )
        )
        .order_by(InvoiceShareLink.created_at.desc())
        .first()
    )
    if existing:
        return existing.code

    expires_at = now + timedelta(days=INVOICE_SHARE_EXPIRE_DAYS)
    for _ in range(10):
        code = _generate_share_code()
        collision = (
            db.query(InvoiceShareLink)
            .filter(InvoiceShareLink.code == code)
            .first()
        )
        if collision:
            continue
        link = InvoiceShareLink(
            code=code,
            invoice_id=invoice_id,
            tenant_id=tenant_id,
            expires_at=expires_at,
        )
        db.add(link)
        db.commit()
        db.refresh(link)
        return code

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not create invoice share link",
    )


def resolve_invoice_from_share_code(db: Session, code: str) -> Invoice:
    now = datetime.utcnow()
    link = (
        db.query(InvoiceShareLink)
        .filter(
            and_(
                InvoiceShareLink.code == code,
                InvoiceShareLink.expires_at > now,
            )
        )
        .first()
    )
    if not link:
        raise HTTPException(status_code=404, detail="Invoice link not found or expired")

    invoice = (
        db.query(Invoice)
        .filter(
            and_(
                Invoice.id == link.invoice_id,
                Invoice.tenant_id == link.tenant_id,
            )
        )
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


def build_invoice_pdf_response(invoice: Invoice, db: Session) -> Response:
    from ..api.v1.pdf_generator_modern import generate_modern_invoice_pdf

    try:
        pdf_content = generate_modern_invoice_pdf(invoice, db)
    except ValueError as e:
        if "customization is required" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Invoice PDF is not available for this invoice.",
            )
        raise HTTPException(status_code=500, detail="Failed to generate invoice PDF")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate invoice PDF")

    filename = f"invoice-{invoice.invoiceNumber}.pdf"
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "private, no-store",
        },
    )
