import io
from datetime import datetime
from typing import Any, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from .pdf_utils import hex_to_color, safe_str, format_date

PRIMARY_HEX = "#1e40af"
TEXT_HEX = "#111827"
BORDER_HEX = "#e5e7eb"


def _item_display(item: dict) -> str:
    t = item.get("type") or "medicine"
    if t == "medicine":
        parts = [safe_str(item.get("medicine_name"))]
        if item.get("dosage"):
            parts.append(safe_str(item.get("dosage")))
        if item.get("frequency"):
            parts.append(safe_str(item.get("frequency")))
        if item.get("duration"):
            parts.append(safe_str(item.get("duration")))
        return " – ".join(p for p in parts if p)
    if t == "vitals":
        parts = [safe_str(item.get("vital_name"))]
        if item.get("vital_value") is not None:
            parts.append(safe_str(item.get("vital_value")))
        if item.get("vital_unit"):
            parts.append(safe_str(item.get("vital_unit")))
        return " ".join(p for p in parts if p)
    parts = [safe_str(item.get("test_name"))]
    if item.get("test_instructions"):
        parts.append(safe_str(item.get("test_instructions")))
    return " – ".join(p for p in parts if p)


def generate_prescription_pdf(prescription, doctor=None, appointment=None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )
    styles = getSampleStyleSheet()
    primary = hex_to_color(PRIMARY_HEX)
    title_style = ParagraphStyle(
        "PrescriptionTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=primary,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        spaceAfter=20,
    )
    body_style = ParagraphStyle(
        "PrescriptionBody",
        parent=styles["Normal"],
        fontSize=10,
        fontName="Helvetica",
        spaceAfter=6,
    )
    small_style = ParagraphStyle(
        "PrescriptionSmall",
        parent=styles["Normal"],
        fontSize=9,
        textColor=hex_to_color("#6b7280"),
        fontName="Helvetica",
        spaceAfter=4,
    )

    story = []
    story.append(Paragraph("Prescription", title_style))
    story.append(Spacer(1, 0.2 * inch))

    patient_name = getattr(prescription, "patient_name", "") or ""
    patient_phone = getattr(prescription, "patient_phone", "") or ""
    prescription_date = getattr(prescription, "prescription_date", None)
    date_str = format_date(prescription_date) if prescription_date else ""

    doc_first = getattr(doctor, "first_name", "") if doctor else ""
    doc_last = getattr(doctor, "last_name", "") if doctor else ""
    doctor_name = f"{doc_first} {doc_last}".strip() or "—"

    info_data = [
        ["Patient", patient_name, "Date", date_str],
        ["Phone", patient_phone, "Doctor", doctor_name],
    ]
    info_table = Table(info_data, colWidths=[1.0 * inch, 2.5 * inch, 1.0 * inch, 2.5 * inch])
    info_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                ("BACKGROUND", (0, 0), (0, -1), hex_to_color("#f3f4f6")),
                ("BACKGROUND", (2, 0), (2, -1), hex_to_color("#f3f4f6")),
                ("GRID", (0, 0), (-1, -1), 0.5, hex_to_color(BORDER_HEX)),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(info_table)
    story.append(Spacer(1, 0.25 * inch))

    items = getattr(prescription, "items", None) or []
    if isinstance(items, str):
        import json
        try:
            items = json.loads(items)
        except Exception:
            items = []
    if not isinstance(items, list):
        items = []

    if items:
        story.append(Paragraph("Items", ParagraphStyle("ItemsHeader", parent=styles["Heading2"], fontSize=12, spaceAfter=8)))
        rows = [["#", "Details"]]
        for i, it in enumerate(items, 1):
            rows.append([str(i), _item_display(it if isinstance(it, dict) else {})])
        items_table = Table(rows, colWidths=[0.5 * inch, 6.0 * inch])
        items_table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("BACKGROUND", (0, 0), (-1, 0), hex_to_color("#e5e7eb")),
                    ("GRID", (0, 0), (-1, -1), 0.5, hex_to_color(BORDER_HEX)),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(items_table)
        story.append(Spacer(1, 0.15 * inch))

    notes = getattr(prescription, "notes", None) or ""
    if notes:
        story.append(Paragraph("Notes", small_style))
        story.append(Paragraph(notes.replace("\n", "<br/>"), body_style))

    doc.build(story)
    return buffer.getvalue()
