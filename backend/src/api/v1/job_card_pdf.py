import io
from datetime import datetime
from typing import Any, Dict, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from sqlalchemy.orm import Session

from ...config.job_card_crud import get_job_card_by_id
from ...config.core_crud import get_user_by_id
from ...core.currency import format_currency
from .pdf_utils import hex_to_color, safe_str, format_date, normalize_items
from .pdf_generator_modern import load_company_logo

PAGE_WIDTH, PAGE_HEIGHT = letter
MARGIN = 0.5 * inch
PRIMARY_HEX = "#1e40af"
TEXT_HEX = "#111827"
BORDER_HEX = "#e5e7eb"


def _vehicle_info(jc: Any, key: str) -> str:
    vi = getattr(jc, "vehicle_info", None) or {}
    if isinstance(vi, dict):
        return safe_str(vi.get(key))
    return ""


def _technician_name(jc: Any, db: Session) -> str:
    uid = getattr(jc, "assigned_to_id", None)
    if not uid:
        return ""
    u = get_user_by_id(str(uid), db)
    if not u:
        return ""
    first = safe_str(getattr(u, "firstName", ""))
    last = safe_str(getattr(u, "lastName", ""))
    name = f"{first} {last}".strip()
    return name or safe_str(getattr(u, "userName", ""))


def _job_card_styles():
    styles = getSampleStyleSheet()
    primary = hex_to_color(PRIMARY_HEX)
    text_c = hex_to_color(TEXT_HEX)
    return {
        "title": ParagraphStyle(
            "JobCardTitle", parent=styles["Heading1"],
            fontSize=16, textColor=primary, alignment=TA_CENTER, fontName="Helvetica-Bold", spaceAfter=12
        ),
        "header": ParagraphStyle(
            "JobCardHeader", parent=styles["Normal"],
            fontSize=9, textColor=primary, fontName="Helvetica-Bold", spaceAfter=4
        ),
        "body": ParagraphStyle(
            "JobCardBody", parent=styles["Normal"],
            fontSize=8, textColor=text_c, fontName="Helvetica", spaceAfter=4
        ),
        "small": ParagraphStyle(
            "JobCardSmall", parent=styles["Normal"],
            fontSize=7, textColor=hex_to_color("#6b7280"), fontName="Helvetica", spaceAfter=2
        ),
        "footer_center": ParagraphStyle(
            "JobCardFooterCenter", parent=styles["Normal"],
            fontSize=7, textColor=hex_to_color("#6b7280"), fontName="Helvetica", alignment=TA_CENTER, spaceAfter=0
        ),
        "company_name": ParagraphStyle(
            "JobCardCompanyName", parent=styles["Normal"],
            fontSize=14, textColor=primary, fontName="Helvetica-Bold", alignment=TA_LEFT, spaceAfter=2
        ),
        "company_body": ParagraphStyle(
            "JobCardCompanyBody", parent=styles["Normal"],
            fontSize=8, textColor=text_c, fontName="Helvetica", alignment=TA_LEFT, spaceAfter=2
        ),
        "company_small": ParagraphStyle(
            "JobCardCompanySmall", parent=styles["Normal"],
            fontSize=7, textColor=hex_to_color("#6b7280"), fontName="Helvetica", alignment=TA_LEFT, spaceAfter=1
        ),
    }


def _company_header(db: Session, tenant_id: str, styles: Dict) -> List:
    elements: List = []
    customization = None
    try:
        from ...config.invoice_customization_models import InvoiceCustomization
        customization = db.query(InvoiceCustomization).filter(
            InvoiceCustomization.tenant_id == tenant_id,
            InvoiceCustomization.is_active == True,
        ).first()
    except Exception:
        customization = None

    logo = load_company_logo(getattr(customization, "company_logo_url", None) if customization else None)

    company_name = (getattr(customization, "company_name", None) if customization else None) or "Your Company"
    company_address = getattr(customization, "company_address", None) if customization else None
    company_phone = getattr(customization, "company_phone", None) if customization else None
    company_email = getattr(customization, "company_email", None) if customization else None
    company_website = getattr(customization, "company_website", None) if customization else None

    company_info: List = []
    if logo:
        company_info.append(logo)
        company_info.append(Spacer(1, 5))
    company_info.append(Paragraph(safe_str(company_name), styles["company_name"]))
    if company_address:
        company_info.append(Paragraph(safe_str(company_address).replace("\n", "<br/>"), styles["company_body"]))
    contact_info = []
    if company_phone:
        contact_info.append(f"Phone: {safe_str(company_phone)}")
    if company_email:
        contact_info.append(f"Email: {safe_str(company_email)}")
    if company_website:
        contact_info.append(f"Website: {safe_str(company_website)}")
    if contact_info:
        company_info.append(Paragraph("<br/>".join(contact_info), styles["company_small"]))

    header_table = Table([[company_info]], colWidths=[7.0 * inch])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (0, 0), "LEFT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 6))
    return elements


def _tenant_currency(db: Session, tenant_id: str) -> str:
    try:
        from ...config.invoice_customization_models import InvoiceCustomization
        customization = db.query(InvoiceCustomization).filter(
            InvoiceCustomization.tenant_id == tenant_id,
            InvoiceCustomization.is_active == True,
        ).first()
        currency = (getattr(customization, "default_currency", None) or "USD").strip() or "USD"
        return currency
    except Exception:
        return "USD"


def _info_table(jc: Any, styles: Dict) -> Table:
    vi = lambda k: _vehicle_info(jc, k)
    job_date = format_date(getattr(jc, "planned_date", None)) or format_date(getattr(jc, "created_at", None))
    time_out = format_date(getattr(jc, "completed_at", None))
    if not time_out and str(getattr(jc, "status", "") or "").lower() == "completed":
        time_out = format_date(getattr(jc, "updated_at", None))
    data = [
        ["Job No.", safe_str(jc.job_card_number), "Job Date", (job_date or "")[:16]],
        ["Reg. No.", vi("registration_number"), "Year", vi("year")],
        ["Mileage", vi("mileage"), "Make", vi("make")],
        ["Model", vi("model"), "Engine No.", vi("engine_number") or vi("engine_no")],
        ["VIN", vi("vin"), "", ""],
        ["Date/Time In", (format_date(getattr(jc, "created_at", None)) or "")[:16], "Date/Time Out", (time_out or "")[:16]],
    ]
    t = Table(data, colWidths=[1.0 * inch, 2.0 * inch, 1.0 * inch, 2.0 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (0, -1), hex_to_color("#f3f4f6")),
        ("BACKGROUND", (2, 0), (2, -1), hex_to_color("#f3f4f6")),
        ("GRID", (0, 0), (-1, -1), 0.5, hex_to_color(BORDER_HEX)),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def _parts_table(jc: Any, styles: Dict, currency: str = "USD") -> tuple:
    items = normalize_items(getattr(jc, "items", None))
    rows = [["Part No.", "Part Desc.", "Qty", "Unit Price", "Line Total"]]
    subtotal = 0.0
    labour_total = float(getattr(jc, "labor_estimate", 0) or 0)
    dict_items = [r for r in items if isinstance(r, dict)]
    has_items = any(
        row.get("sku") or row.get("part_no") or row.get("partNo")
        or row.get("part_number") or row.get("partNumber")
        or row.get("description") or row.get("part_description")
        or row.get("unit_price") not in (None, "")
        or row.get("unitPrice") not in (None, "")
        for row in dict_items
    )
    if has_items:
        for row in dict_items:
            part_no = safe_str(
                row.get("sku")
                or row.get("part_no")
                or row.get("partNo")
                or row.get("part_number")
                or row.get("partNumber")
            )
            part_desc = safe_str(
                row.get("description")
                or row.get("part_description")
                or row.get("productName")
                or row.get("name")
            )
            qty = row.get("qty")
            if qty is None:
                qty = row.get("quantity", "")
            qty_s = str(qty) if qty not in ("", None) else ""
            try:
                qty_val = float(qty) if qty not in ("", None) else 0.0
            except (TypeError, ValueError):
                qty_val = 0.0
            unit_price = row.get("unit_price")
            if unit_price is None:
                unit_price = row.get("unitPrice", 0)
            try:
                up_val = float(unit_price) if unit_price not in (None, "") else 0.0
            except (TypeError, ValueError):
                up_val = 0.0
            labour = row.get("labour")
            if labour is None:
                labour = row.get("labor", 0)
            try:
                labour_val = float(labour) if labour not in (None, "") else 0.0
            except (TypeError, ValueError):
                labour_val = 0.0
            line_total = up_val * qty_val
            subtotal += line_total
            labour_total += labour_val
            rows.append([
                part_no[:20],
                part_desc[:35],
                qty_s[:6],
                format_currency(up_val, currency) if up_val else "",
                format_currency(line_total, currency) if line_total else "",
            ])
    else:
        subtotal = float(getattr(jc, "parts_estimate", 0) or 0)
        if subtotal:
            rows.append(["", "Estimated parts", "", "", format_currency(subtotal, currency)])
        else:
            rows.append(["", "No parts recorded", "", "", ""])
    col_widths = [0.85 * inch, 2.4 * inch, 0.55 * inch, 1.0 * inch, 1.0 * inch]
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), hex_to_color(PRIMARY_HEX)),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, hex_to_color(BORDER_HEX)),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t, subtotal, labour_total


def _totals_table(subtotal: float, labour_total: float, vat_rate: float = 0.15, currency: str = "USD") -> tuple:
    before_vat = subtotal + labour_total
    vat_val = before_vat * vat_rate
    total_val = before_vat + vat_val
    data = [
        ["Sub Total", format_currency(subtotal, currency)],
    ]
    if labour_total:
        data.append(["Labour", format_currency(labour_total, currency)])
    if vat_rate and vat_rate > 0:
        vat_pct = f"VAT ({int(round(vat_rate * 100))}%)"
        data.append([vat_pct, format_currency(vat_val, currency)])
    data.append(["TOTAL", format_currency(total_val, currency)])
    t = Table(data, colWidths=[1.2 * inch, 1.2 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -2), "Helvetica"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEABOVE", (0, -1), (-1, -1), 1, hex_to_color(PRIMARY_HEX)),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t, before_vat, vat_val, total_val


def generate_job_card_pdf(job_card_id: str, db: Session, tenant_id: str) -> bytes:
    jc = get_job_card_by_id(job_card_id, db, tenant_id)
    if not jc:
        raise ValueError("Job card not found")
    styles = _job_card_styles()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
    )
    story = []

    story.extend(_company_header(db, tenant_id, styles))

    story.append(Paragraph("VEHICLE JOB CARD", styles["title"]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Job & Vehicle Information", styles["header"]))
    story.append(_info_table(jc, styles))
    story.append(Spacer(1, 14))

    story.append(Paragraph("Reported Defect", styles["header"]))
    desc = safe_str(getattr(jc, "description", None)) or "—"
    story.append(Paragraph(desc.replace("\n", "<br/>"), styles["body"]))
    story.append(Spacer(1, 14))

    story.append(Paragraph("Parts & Labour", styles["header"]))
    currency = _tenant_currency(db, tenant_id)
    parts_tbl, subtotal, labour_total = _parts_table(jc, styles, currency)
    story.append(parts_tbl)
    story.append(Spacer(1, 12))

    vat_rate = getattr(jc, "vat_rate", None)
    if vat_rate is None:
        vat_rate = 0.15
    totals_tbl, before_vat, vat_val, total_val = _totals_table(subtotal, labour_total, vat_rate, currency)
    story.append(totals_tbl)
    story.append(Spacer(1, 16))

    story.append(Paragraph("This is not an invoice; all estimates are valid for 30 days.", styles["small"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Powered by Biztrack.uk", styles["footer_center"]))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
