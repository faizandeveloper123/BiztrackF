import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # Email configuration from environment variables
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        self.from_name = os.getenv('FROM_NAME', 'BizTrack')
        self.smtp_timeout = int(os.getenv('SMTP_TIMEOUT', '15'))
        
    def send_invoice_email(
        self, 
        to_email: str, 
        customer_name: str, 
        invoice_number: str, 
        invoice_total: float,
        currency: str = 'USD',
        due_date: str = None,
        invoice_pdf_path: Optional[str] = None,
        invoice_pdf_bytes: Optional[bytes] = None,
        custom_message: Optional[str] = None
    ) -> bool:
        """Send invoice email to customer"""
        try:
            if not to_email:
                logger.error("Recipient email address is required")
                return False
                
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = f"Invoice {invoice_number} - Payment Due"
            
            custom_message_section = ""
            if custom_message:
                custom_message_section = f"\n\n{custom_message}\n"
            
            body = f"""
Dear {customer_name},

Thank you for your business! Please find your invoice details below:

Invoice Number: {invoice_number}
Amount Due: {currency} {invoice_total:.2f}
Due Date: {due_date or 'As agreed'}
{custom_message_section}
Please find the invoice PDF attached to this email. Please make payment at your earliest convenience. If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your prompt payment.

Best regards,
{self.from_name}
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            if invoice_pdf_bytes:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(invoice_pdf_bytes)
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename=invoice-{invoice_number}.pdf'
                )
                msg.attach(part)
            elif invoice_pdf_path and os.path.exists(invoice_pdf_path):
                with open(invoice_pdf_path, "rb") as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename=invoice-{invoice_number}.pdf'
                    )
                    msg.attach(part)
            
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Email not sent.")
                return False
                
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            text = msg.as_string()
            server.sendmail(self.from_email, to_email, text)
            server.quit()
            
            logger.info(f"Invoice email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send invoice email to {to_email}: {str(e)}")
            return False
    
    def send_bulk_invoice_emails(
        self, 
        invoices_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Send bulk invoice emails"""
        results = {
            'sent': 0,
            'failed': 0,
            'errors': []
        }
        
        for invoice_data in invoices_data:
            try:
                success = self.send_invoice_email(
                    to_email=invoice_data['customer_email'],
                    customer_name=invoice_data['customer_name'],
                    invoice_number=invoice_data['invoice_number'],
                    invoice_total=invoice_data['total'],
                    currency=invoice_data.get('currency', 'USD'),
                    due_date=invoice_data.get('due_date'),
                    invoice_pdf_path=invoice_data.get('pdf_path')
                )
                
                if success:
                    results['sent'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append(f"Failed to send email for invoice {invoice_data['invoice_number']}")
                    
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"Error sending email for invoice {invoice_data['invoice_number']}: {str(e)}")
        
        return results
    
    def send_user_invitation_email(
        self,
        to_email: str,
        user_name: str,
        inviter_name: str,
        tenant_name: Optional[str] = None,
        role_name: Optional[str] = None,
        login_url: Optional[str] = None
    ) -> bool:
        """Send user invitation email"""
        try:
            if not to_email:
                logger.error("Recipient email address is required")
                return False
            
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Email not sent.")
                return False
            
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = f"You've been invited to join {tenant_name or 'BizTrack'}"
            
            tenant_info = f" to {tenant_name}" if tenant_name else ""
            role_info = f" as {role_name}" if role_name else ""
            login_info = f"\n\nYou can log in at: {login_url}" if login_url else ""
            
            body = f"""
Dear {user_name},

You have been invited{tenant_info}{role_info} by {inviter_name}.

Welcome to {self.from_name}! We're excited to have you on board.

{login_info}

If you have any questions, please don't hesitate to reach out.

Best regards,
{self.from_name} Team
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=self.smtp_timeout)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            text = msg.as_string()
            server.sendmail(self.from_email, to_email, text)
            server.quit()
            
            logger.info(f"Invitation email sent successfully to {to_email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            error_msg = str(e)
            if "535" in error_msg or "BadCredentials" in error_msg or "Username and Password not accepted" in error_msg:
                logger.error(f"Gmail authentication failed. Please use an App Password instead of your regular Gmail password. Error: {error_msg}")
            else:
                logger.error(f"SMTP authentication failed: {error_msg}")
            return False
        except Exception as e:
            logger.error(f"Failed to send invitation email to {to_email}: {str(e)}")
            return False
    
    def send_report_email(
        self,
        to_email: str,
        subject: str,
        body: str
    ) -> bool:
        """Send a general report email"""
        try:
            if not to_email:
                logger.error("Recipient email address is required")
                return False
            
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Email not sent.")
                return False
            
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            text = msg.as_string()
            server.sendmail(self.from_email, to_email, text)
            server.quit()
            
            logger.info(f"Report email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send report email to {to_email}: {str(e)}")
            return False
    
    def send_assignment_email(
        self,
        to_email: str,
        assignee_name: str,
        assigner_name: str,
        entity_type: str,
        entity_name: str,
        action_url: Optional[str] = None,
        extra_details: Optional[Dict[str, str]] = None
    ) -> bool:
        try:
            if not to_email:
                logger.error("Recipient email is required for assignment notification")
                return False
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Assignment email not sent.")
                return False
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = f"You have been assigned: {entity_type} - {entity_name[:50]}{'...' if len(entity_name) > 50 else ''}"
            link_line = f"\n\nOpen it here: {action_url}" if action_url else ""
            details_block = ""
            if extra_details:
                details_block = "\n".join(f"{k}: {v}" for k, v in extra_details.items() if v) + "\n\n" if any(extra_details.values()) else ""
            body = f"""
Dear {assignee_name},

{assigner_name} has assigned you to the following:

Type: {entity_type}
Name: {entity_name}
{details_block}{link_line}

Best regards,
{self.from_name}
            """
            msg.attach(MIMEText(body.strip(), 'plain'))
            server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=self.smtp_timeout)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.sendmail(self.from_email, to_email, msg.as_string())
            server.quit()
            logger.info(f"Assignment email sent to {to_email} for {entity_type}: {entity_name[:30]}")
            return True
        except Exception as e:
            logger.error(f"Failed to send assignment email to {to_email}: {str(e)}")
            return False

    def send_assigner_confirmation_email(
        self,
        to_email: str,
        assigner_name: str,
        receiver_names: str,
        entity_type: str,
        entity_name: str,
        action_url: Optional[str] = None,
        extra_details: Optional[Dict[str, str]] = None
    ) -> bool:
        try:
            if not to_email:
                logger.error("Recipient email is required for assigner confirmation")
                return False
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Assigner confirmation email not sent.")
                return False
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = f"Assignment confirmation: {entity_type} - {entity_name[:50]}{'...' if len(entity_name) > 50 else ''}"
            link_line = f"\n\nOpen it here: {action_url}" if action_url else ""
            details_block = ""
            if extra_details:
                details_block = "\n".join(f"{k}: {v}" for k, v in extra_details.items() if v) + "\n\n" if any(extra_details.values()) else ""
            body = f"""
Dear {assigner_name},

You assigned the following:

Type: {entity_type}
Name: {entity_name}
Assigned to: {receiver_names}
{details_block}{link_line}

Best regards,
{self.from_name}
            """
            msg.attach(MIMEText(body.strip(), 'plain'))
            server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=self.smtp_timeout)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.sendmail(self.from_email, to_email, msg.as_string())
            server.quit()
            logger.info(f"Assigner confirmation email sent to {to_email} for {entity_type}: {entity_name[:30]}")
            return True
        except Exception as e:
            logger.error(f"Failed to send assigner confirmation email to {to_email}: {str(e)}")
            return False

    def send_task_message_email(
        self,
        to_email: str,
        recipient_name: str,
        sender_name: str,
        task_title: str,
        message_body: str,
        is_info_request: bool = False,
        action_url: Optional[str] = None,
    ) -> bool:
        try:
            if not to_email:
                return False
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Task message email not sent.")
                return False
            subject_prefix = "Info requested" if is_info_request else "New message"
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = f"{subject_prefix} on task: {task_title[:60]}{'...' if len(task_title) > 60 else ''}"
            link_line = f"\n\nOpen the task: {action_url}" if action_url else ""
            intro = (
                f"{sender_name} asked for more information on the task \"{task_title}\"."
                if is_info_request
                else f"{sender_name} sent a message on the task \"{task_title}\"."
            )
            body = f"""
Dear {recipient_name},

{intro}

Message:
{message_body}
{link_line}

Best regards,
{self.from_name}
            """
            msg.attach(MIMEText(body.strip(), 'plain'))
            server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=self.smtp_timeout)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.sendmail(self.from_email, to_email, msg.as_string())
            server.quit()
            return True
        except Exception as e:
            logger.error(f"Failed to send task message email to {to_email}: {str(e)}")
            return False

    def send_mot_booking_confirmation_email(
        self,
        to_email: str,
        customer_name: str,
        tenant_name: str,
        subject: str,
        html_body: str,
        plain_body: str,
        reply_to: Optional[str] = None,
    ) -> bool:
        try:
            if not to_email:
                logger.error("Recipient email address is required")
                return False
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. MOT booking email not sent.")
                return False

            sender_name = tenant_name or self.from_name
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{sender_name} <{self.from_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            if reply_to:
                msg["Reply-To"] = reply_to

            msg.attach(MIMEText(plain_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.sendmail(self.from_email, to_email, msg.as_string())
            server.quit()

            logger.info("MOT booking confirmation email sent to %s for %s", to_email, customer_name)
            return True
        except Exception as e:
            logger.error("Failed to send MOT booking confirmation to %s: %s", to_email, str(e))
            return False

    def send_mot_due_reminder_email(
        self,
        to_email: str,
        customer_name: str,
        tenant_name: str,
        subject: str,
        html_body: str,
        plain_body: str,
        reply_to: Optional[str] = None,
    ) -> bool:
        try:
            if not to_email:
                logger.error("Recipient email address is required")
                return False
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. MOT due reminder email not sent.")
                return False

            sender_name = tenant_name or self.from_name
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{sender_name} <{self.from_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            if reply_to:
                msg["Reply-To"] = reply_to

            msg.attach(MIMEText(plain_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.sendmail(self.from_email, to_email, msg.as_string())
            server.quit()

            logger.info("MOT due reminder email sent to %s for %s", to_email, customer_name)
            return True
        except Exception as e:
            logger.error("Failed to send MOT due reminder to %s: %s", to_email, str(e))
            return False

    def send_task_time_reminder_email(
        self,
        to_email: str,
        assignee_name: str,
        task_title: str,
        remaining_time: str,
        estimated_time: str,
        tracked_time: str,
    ) -> bool:
        try:
            if not to_email:
                return False
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Task time reminder not sent.")
                return False
            msg = MIMEMultipart()
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = f"Task time reminder: {task_title[:50]}{'...' if len(task_title) > 50 else ''}"
            body = f"""
Dear {assignee_name},

Your assigned task is running low on estimated time.

Task: {task_title}
Estimated time: {estimated_time}
Time tracked so far: {tracked_time}
Time remaining: {remaining_time}

Please review the task and update progress if needed.

Best regards,
{self.from_name}
            """
            msg.attach(MIMEText(body.strip(), 'plain'))
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.sendmail(self.from_email, to_email, msg.as_string())
            server.quit()
            logger.info(f"Task time reminder sent to {to_email} for task: {task_title[:30]}")
            return True
        except Exception as e:
            logger.error(f"Failed to send task time reminder to {to_email}: {str(e)}")
            return False

    def smtp_configured(self) -> bool:
        return bool(self.smtp_username and self.smtp_password)

    def send_lead_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
    ) -> bool:
        try:
            if not to_email:
                return False
            if not self.smtp_configured():
                logger.warning("SMTP credentials not configured. Lead email not sent.")
                return False
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body_text or body_html, "plain"))
            msg.attach(MIMEText(body_html, "html"))
            server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=self.smtp_timeout)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.sendmail(self.from_email, to_email, msg.as_string())
            server.quit()
            logger.info(f"Lead email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send lead email to {to_email}: {str(e)}")
            return False

    def test_email_connection(self) -> bool:
        """Test email connection"""
        try:
            if not self.smtp_username or not self.smtp_password:
                return False
                
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.quit()
            return True
        except Exception as e:
            logger.error(f"Email connection test failed: {str(e)}")
            return False
