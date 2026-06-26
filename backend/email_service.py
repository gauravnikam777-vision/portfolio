"""
Email Service
Sends contact-form notifications via SMTP (e.g. Gmail with an App Password).
Disabled by default (EMAIL_ENABLED=False) so the app runs fine without any
mail credentials configured — it just logs instead of sending.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self, app_config):
        self.enabled = app_config.get('EMAIL_ENABLED', False)
        self.server = app_config.get('MAIL_SERVER')
        self.port = app_config.get('MAIL_PORT')
        self.use_tls = app_config.get('MAIL_USE_TLS')
        self.username = app_config.get('MAIL_USERNAME')
        self.password = app_config.get('MAIL_PASSWORD')
        self.sender = app_config.get('MAIL_DEFAULT_SENDER') or self.username
        self.owner_email = app_config.get('OWNER_EMAIL')

    def _send(self, to_addr: str, subject: str, html_body: str) -> bool:
        if not self.enabled:
            logger.info(f"[EMAIL DISABLED] Would send to {to_addr}: {subject}")
            return False

        if not (self.username and self.password):
            logger.warning("Email enabled but MAIL_USERNAME/MAIL_PASSWORD not set — skipping send.")
            return False

        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.sender
            msg['To'] = to_addr
            msg.attach(MIMEText(html_body, 'html'))

            with smtplib.SMTP(self.server, self.port, timeout=10) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.username, self.password)
                server.sendmail(self.sender, [to_addr], msg.as_string())

            logger.info(f"Email sent to {to_addr}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    def notify_owner_of_contact(self, name: str, email: str, message: str) -> bool:
        subject = f"New portfolio message from {name}"
        body = f"""
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Message:</strong></p>
        <p>{message}</p>
        """
        return self._send(self.owner_email, subject, body)

    def send_confirmation_to_visitor(self, name: str, email: str) -> bool:
        subject = "Thanks for reaching out!"
        body = f"""
        <p>Hi {name},</p>
        <p>Thanks for your message — I'll get back to you as soon as I can.</p>
        <p>Best,<br>Gaurav Nikam</p>
        """
        return self._send(email, subject, body)
