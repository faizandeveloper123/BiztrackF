import io
from datetime import datetime
from typing import Optional, Dict, Any, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.lib.utils import ImageReader
from sqlalchemy.orm import Session
import requests
from PIL import Image as PILImage

from ...config.installment_models import InstallmentPlan, Installment
from ...config.installment_crud import get_installment_plan_by_id, get_installments_by_plan
from ...models.invoices import Invoice, Payment
from ...api.v1.invoices.items.logic import get_invoice_by_id
from ...api.v1.crm.customers.logic import get_customer_by_id
from ...api.v1.crm.guarantors.logic import get_guarantors_by_customer
from ...core.currency import format_currency

FRONTEND_COLORS = {
    'primary': '#1e40af',
    'text_primary': '#111827',
    'text_secondary': '#6b7280',
    'border': '#e5e7eb',
}


def hex_to_color(hex_color: str):
    hex_color = hex_color.lstrip('#')
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    return colors.Color(r/255.0, g/255.0, b/255.0)


def load_customer_image(image_url: Optional[str]) -> Optional[Image]:
    if not image_url or not (image_url.startswith("http://") or image_url.startswith("https://")):
        return None
    try:
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        img_data = io.BytesIO(response.content)
        pil_img = PILImage.open(img_data)
        w, h = 1.2 * inch, 1.2 * inch
        pil_img.thumbnail((int(w), int(h)), PILImage.Resampling.LANCZOS)
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            pil_img.save(tmp.name, format='PNG')
            return Image(tmp.name, width=min(pil_img.width, int(w)), height=min(pil_img.height, int(h)))
    except Exception:
        return None


def generate_customer_info_pdf(plan_id: str, db: Session, tenant_id: str) -> bytes:
    plan = get_installment_plan_by_id(plan_id, db, tenant_id)
    if not plan:
        raise ValueError("Installment plan not found")
    invoice = get_invoice_by_id(str(plan.invoice_id), db, tenant_id)
    if not invoice:
        raise ValueError("Invoice not found")
    customer = None
    guarantors = []
    if invoice.customerId:
        customer = get_customer_by_id(db, invoice.customerId, tenant_id)
        if customer:
            guarantors = get_guarantors_by_customer(db, str(customer.id), tenant_id)
    installments = get_installments_by_plan(plan_id, db, tenant_id)
    payments_by_id = {}
    for inst in installments:
        if inst.payment_id:
            pay = db.query(Payment).filter(Payment.id == inst.payment_id, Payment.tenant_id == tenant_id).first()
            if pay:
                payments_by_id[str(inst.id)] = pay

    customization = None
    try:
        from ...config.invoice_customization_models import InvoiceCustomization
        cust_obj = db.query(InvoiceCustomization).filter(
            InvoiceCustomization.tenant_id == tenant_id,
            InvoiceCustomization.is_active == True
        ).first()
        if cust_obj:
            customization = {"company_name": getattr(cust_obj, "company_name", "Company")}
    except Exception:
        pass
    company_name = (customization or {}).get("company_name", "Company")

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustInfoTitle', parent=styles['Heading1'], fontSize=14, textColor=hex_to_color(FRONTEND_COLORS['primary']), alignment=TA_LEFT, fontName='Helvetica-Bold'
    )
    header_style = ParagraphStyle(
        'CustInfoHeader', parent=styles['Normal'], fontSize=9, textColor=hex_to_color(FRONTEND_COLORS['primary']), fontName='Helvetica-Bold'
    )
    body_style = ParagraphStyle(
        'CustInfoBody', parent=styles['Normal'], fontSize=8, textColor=hex_to_color(FRONTEND_COLORS['text_primary']), fontName='Helvetica'
    )
    small_style = ParagraphStyle(
        'CustInfoSmall', parent=styles['Normal'], fontSize=7, textColor=hex_to_color(FRONTEND_COLORS['text_secondary']), fontName='Helvetica'
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=0.5*inch, leftMargin=0.5*inch, topMargin=0.5*inch, bottomMargin=0.5*inch)
    story = []

    customer_img = None
    if customer and getattr(customer, 'image_url', None):
        customer_img = load_customer_image(customer.image_url)

    header_left = [
        Paragraph(company_name, title_style),
        Paragraph("Customer Information Form", header_style),
        Paragraph(f"Date: {datetime.utcnow().strftime('%d-%b-%Y')}", small_style),
    ]
    if customer:
        header_left.append(Paragraph(f"Account No.: {customer.customerId or ''}", small_style))
    header_row = [header_left]
    if customer_img:
        header_row.append(customer_img)
    else:
        header_row.append(Paragraph("", body_style))
    header_table = Table([header_row], colWidths=[4*inch, 1.5*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 12))

    cust_name = f"{invoice.customerName}" if invoice else ""
    if customer:
        cust_name = f"{customer.firstName or ''} {customer.lastName or ''}".strip() or cust_name
    story.append(Paragraph("Customer Name", header_style))
    story.append(Paragraph(cust_name or "-", body_style))
    story.append(Paragraph("Mobile", header_style))
    story.append(Paragraph((customer.mobile if customer else None) or (invoice.customerPhone if invoice else None) or "-", body_style))
    story.append(Paragraph("Occupation", header_style))
    story.append(Paragraph("-", body_style))
    story.append(Paragraph("Residential Address", header_style))
    story.append(Paragraph((customer.address if customer else None) or (invoice.billingAddress if invoice else None) or "-", body_style))
    story.append(Paragraph("Official Address", header_style))
    story.append(Paragraph("-", body_style))
    story.append(Paragraph("Customer No.", header_style))
    story.append(Paragraph((customer.customerId if customer else None) or "-", body_style))
    story.append(Paragraph("NIC#", header_style))
    story.append(Paragraph((customer.cnic if customer else None) or "-", body_style))
    story.append(Paragraph("Repeat Cust/Gr", header_style))
    story.append(Paragraph("0/0", body_style))
    story.append(Spacer(1, 8))

    total_price = float(invoice.total or 0)
    total_paid = float(invoice.totalPaid or 0)
    balance = float(invoice.balance or 0)
    per_inst = plan.total_amount / plan.number_of_installments if plan.number_of_installments else 0
    received_count = sum(1 for i in installments if (i.paid_amount or 0) >= i.amount)
    story.append(Paragraph("Product / Sales", header_style))
    product_line = "Invoice items"
    if invoice.items and len(invoice.items) > 0:
        first = invoice.items[0]
        product_line = first.get("description", first.get("productSku", product_line)) or product_line
    story.append(Paragraph(f"Product: {product_line}", body_style))
    story.append(Paragraph(f"Total Price: {format_currency(total_price, plan.currency or 'USD')}", body_style))
    story.append(Paragraph(f"Installment Amount: {format_currency(per_inst, plan.currency or 'USD')}", body_style))
    story.append(Paragraph(f"Total Received: {format_currency(total_paid, plan.currency or 'USD')}", body_style))
    story.append(Paragraph(f"Balance: {format_currency(balance, plan.currency or 'USD')}", body_style))
    story.append(Paragraph(f"Duration: {plan.number_of_installments} | Installments Received: {received_count} | Remaining: {plan.number_of_installments - received_count} | Status: {plan.status or 'Active'}", body_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Guarantor / Friend Details", header_style))
    guar_headers = ["Name", "Mobile No", "CNIC", "Res. Address", "Off Address", "Occupation", "Relation"]
    guar_data = [guar_headers]
    for g in guarantors:
        guar_data.append([
            g.name or "",
            g.mobile or "",
            g.cnic or "",
            (g.residential_address or "")[:40],
            (g.official_address or "")[:40],
            g.occupation or "",
            g.relation or "",
        ])
    if len(guar_data) == 1:
        guar_data.append(["-", "-", "-", "-", "-", "-", "-"])
    guar_table = Table(guar_data, colWidths=[1.2*inch, 0.9*inch, 0.9*inch, 1.2*inch, 1.2*inch, 0.7*inch, 0.6*inch])
    guar_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), hex_to_color(FRONTEND_COLORS['primary'])),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(guar_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Installment Payment History", header_style))
    hist_headers = ["Srd", "Date", "Receipt#", "PreBal.", "Install.", "Disc.", "Balance", "Fine", "FineType", "Recovery", "Remarks"]
    hist_data = [hist_headers]
    running_bal = total_price
    for inst in installments:
        pay = payments_by_id.get(str(inst.id))
        date_str = pay.paymentDate.strftime('%d-%b-%Y') if pay and pay.paymentDate else (inst.due_date.strftime('%d-%b-%Y') if inst.due_date else "-")
        receipt = (pay.reference if pay and pay.reference else (str(pay.id)[:8] if pay else "")) or "-"
        pre_bal = running_bal
        inst_amt = float(inst.amount or 0)
        paid_amt = float(inst.paid_amount or 0)
        running_bal = running_bal - paid_amt
        hist_data.append([
            str(inst.sequence_number),
            date_str,
            receipt,
            format_currency(pre_bal, plan.currency or 'USD'),
            format_currency(inst_amt, plan.currency or 'USD'),
            "0",
            format_currency(max(0, running_bal), plan.currency or 'USD'),
            "0",
            "",
            "",
            "",
        ])
    if len(hist_data) == 1:
        hist_data.append(["1", "-", "-", "-", "-", "0", "-", "0", "-", "-", "-"])
    hist_table = Table(hist_data, colWidths=[0.4*inch, 0.7*inch, 0.8*inch, 0.7*inch, 0.65*inch, 0.4*inch, 0.7*inch, 0.4*inch, 0.5*inch, 0.5*inch, 0.5*inch])
    hist_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), hex_to_color(FRONTEND_COLORS['primary'])),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(hist_table)
    story.append(Spacer(1, 12))
    footer_style = ParagraphStyle(
        'CustInfoFooter', parent=styles['Normal'], fontSize=7, textColor=hex_to_color(FRONTEND_COLORS['text_secondary']), fontName='Helvetica', alignment=TA_CENTER
    )
    story.append(Paragraph("Powered by Biztrack.uk", footer_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
