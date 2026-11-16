import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
import logging
from app.config import settings

import json
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


def is_email_configured() -> bool:
    """Check if any valid email provider (Resend, Brevo, SendGrid, or SMTP) is configured"""
    has_resend = bool(settings.RESEND_API_KEY and settings.RESEND_API_KEY != "your-resend-api-key")
    has_brevo = bool(settings.BREVO_API_KEY and settings.BREVO_API_KEY != "your-brevo-api-key")
    has_sendgrid = bool(settings.SENDGRID_API_KEY and settings.SENDGRID_API_KEY != "your-sendgrid-api-key")
    has_smtp = bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD and settings.SMTP_PASSWORD != "your-16-digit-gmail-app-password")
    return has_resend or has_brevo or has_sendgrid or has_smtp


def _send_resend_sync(to_email: str, to_name: str, subject: str, html_content: str, reply_to: Optional[str] = None) -> bool:
    """Send email via Resend REST API (No Google password required)"""
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    }
    sender_email = settings.RESEND_FROM or "onboarding@resend.dev"
    sender_name = settings.FROM_NAME or "TRS Products"
    payload = {
        "from": f"{sender_name} <{sender_email}>",
        "to": [to_email],
        "subject": subject,
        "html": html_content,
    }
    if reply_to:
        payload["reply_to"] = reply_to

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as response:
            if response.status in (200, 201):
                logger.info(f"Email successfully sent via Resend API to '{to_email}'")
                return True
    except urllib.error.HTTPError as http_err:
        err_body = http_err.read().decode("utf-8", errors="ignore")
        logger.warning(f"Resend API HTTP Error {http_err.code}: {err_body}")

        # If Resend free testing domain (onboarding@resend.dev) only allows sending to the registered account:
        if "only send testing emails to your own email address" in err_body:
            fallback_to = settings.SMTP_USER or "eswariinpand@gmail.com"
            logger.info(f"Resend Free Sandbox: Forwarding tracking email to registered account '{fallback_to}' (Intended for: {to_email})")
            try:
                payload["to"] = [fallback_to]
                payload["subject"] = f"[For {to_email}] " + subject
                data = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(url, data=data, headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=15) as fb_resp:
                    if fb_resp.status in (200, 201):
                        logger.info(f"Email successfully delivered to '{fallback_to}' via Resend API")
                        return True
            except Exception as fb_err:
                logger.error(f"Fallback Resend email failed: {fb_err}")
                return False
        return False
    except Exception as e:
        logger.error(f"Failed to send email via Resend API: {e}")
        return False


def _send_brevo_sync(to_email: str, to_name: str, subject: str, html_content: str, reply_to: Optional[str] = None) -> bool:
    """Send email via Brevo REST API (No Google password required)"""
    try:
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "api-key": settings.BREVO_API_KEY,
            "Content-Type": "application/json",
            "accept": "application/json",
        }
        sender_email = settings.FROM_EMAIL or "support@trsimports.com"
        sender_name = settings.FROM_NAME or "TRS Products"
        payload = {
            "sender": {"name": sender_name, "email": sender_email},
            "to": [{"email": to_email, "name": to_name or to_email}],
            "subject": subject,
            "htmlContent": html_content,
        }
        if reply_to:
            payload["replyTo"] = {"email": reply_to}

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as response:
            if response.status in (200, 201):
                logger.info(f"Email successfully sent via Brevo API to '{to_email}'")
                return True
    except Exception as e:
        logger.error(f"Failed to send email via Brevo API: {e}")
        return False


def _send_smtp_sync(to_email: str, to_name: str, subject: str, html_content: str, reply_to: Optional[str] = None) -> bool:
    """Send email synchronously using standard SMTP (e.g., Gmail, Outlook, Custom SMTP server)"""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        sender_name = settings.FROM_NAME or "TRS Products"
        sender_email = settings.FROM_EMAIL or settings.SMTP_USER
        msg["From"] = formataddr((sender_name, sender_email))
        msg["Reply-To"] = reply_to if reply_to else sender_email
        msg["To"] = formataddr((to_name, to_email)) if to_name else to_email

        html_part = MIMEText(html_content, "html", "utf-8")
        msg.attach(html_part)

        if settings.SMTP_SSL:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            if settings.SMTP_TLS:
                server.starttls()

        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

        envelope_sender = settings.SMTP_USER or sender_email
        server.sendmail(envelope_sender, [to_email], msg.as_string())
        server.quit()
        logger.info(f"Email successfully sent via SMTP to '{to_email}' with subject '{subject}'")
        return True
    except Exception as e:
        logger.error(f"Failed to send email via SMTP to '{to_email}': {e}")
        return False


def _send_sendgrid_sync(to_email: str, to_name: str, subject: str, html_content: str, reply_to: Optional[str] = None) -> bool:
    """Send email synchronously via SendGrid Web API"""
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Email, To, Content

        sender_email = settings.FROM_EMAIL or "noreply@trsimports.com"
        sender_name = settings.FROM_NAME or "TRS Products"

        message = Mail(
            from_email=Email(sender_email, sender_name),
            to_emails=To(to_email, to_name or to_email),
            subject=subject,
            html_content=Content("text/html", html_content),
        )
        if reply_to:
            message.reply_to = reply_to

        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(f"Email successfully sent via SendGrid to '{to_email}' (Status: {response.status_code})")
        return True
    except Exception as e:
        logger.error(f"Failed to send email via SendGrid to '{to_email}': {e}")
        return False


async def send_email(to_email: str, to_name: str, subject: str, html_content: str, reply_to: Optional[str] = None) -> bool:
    """
    Send email via configured provider:
    1. SMTP (Gmail, Outlook, Custom SMTP)
    2. Resend API (No password, simple API key)
    3. Brevo API (No password, simple API key)
    4. SendGrid API
    """
    if not to_email or not str(to_email).strip():
        logger.warning("No recipient email address provided.")
        return False

    to_email_str = str(to_email).strip()
    to_name_str = str(to_name or "").strip()

    # 1. SMTP (e.g. Gmail with App Password - delivers directly)
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD and settings.SMTP_PASSWORD != "your-16-digit-gmail-app-password":
        return await asyncio.to_thread(_send_smtp_sync, to_email_str, to_name_str, subject, html_content, reply_to)

    # 2. Resend API (Alternative)
    if settings.RESEND_API_KEY and settings.RESEND_API_KEY != "your-resend-api-key":
        return await asyncio.to_thread(_send_resend_sync, to_email_str, to_name_str, subject, html_content, reply_to)

    # 3. Brevo API (Alternative)
    if settings.BREVO_API_KEY and settings.BREVO_API_KEY != "your-brevo-api-key":
        return await asyncio.to_thread(_send_brevo_sync, to_email_str, to_name_str, subject, html_content, reply_to)

    # 4. SendGrid API (Alternative)
    if settings.SENDGRID_API_KEY and settings.SENDGRID_API_KEY != "your-sendgrid-api-key":
        return await asyncio.to_thread(_send_sendgrid_sync, to_email_str, to_name_str, subject, html_content, reply_to)

    logger.warning(
        f"[EMAIL NOT SENT] No email service configured. "
        f"Recipient: {to_email_str}, Subject: {subject}"
    )
    return False


def get_order_confirmation_email(order, items) -> str:
    """Generate order confirmation email HTML"""
    items_html = ""
    for item in (items or []):
        p_name = getattr(item, 'product_name', 'Product')
        qty = getattr(item, 'quantity', 1)
        u_price = getattr(item, 'unit_price', 0.0)
        tot = getattr(item, 'total', u_price * qty)
        items_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">{p_name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{qty}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. {u_price:,.2f}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. {tot:,.2f}</td>
        </tr>
        """

    order_num = getattr(order, 'order_number', 'N/A')
    c_name = getattr(order, 'customer_name', 'Customer')
    address = getattr(order, 'address', '')
    city = getattr(order, 'city', '')
    phone = getattr(order, 'phone', '')
    subtotal = getattr(order, 'subtotal', 0.0)
    del_charge = getattr(order, 'delivery_charge', 0.0)
    total = getattr(order, 'total', 0.0)

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Confirmation - TRS Products</title>
    </head>
    <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1a3c2e, #234d3a); padding: 30px; text-align: center;">
                <h1 style="color: #c9a227; margin: 0; font-size: 28px;">TRS IMPORTS</h1>
                <p style="color: #a8e8bf; margin: 5px 0 0;">Quality · Trust · Goodness</p>
            </div>
            
            <!-- Order Success -->
            <div style="padding: 30px; text-align: center; border-bottom: 2px solid #f0f0f0;">
                <div style="width: 60px; height: 60px; background: #d4f5e3; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                    <span style="color: #1a3c2e; font-size: 30px;">✓</span>
                </div>
                <h2 style="color: #1a3c2e; margin: 0;">Order Confirmed!</h2>
                <p style="color: #666;">Thank you for shopping with TRS Products</p>
                <div style="background: #f8f8f8; border-radius: 8px; padding: 15px; display: inline-block;">
                    <strong style="color: #c9a227; font-size: 18px;">{order_num}</strong>
                </div>
            </div>
            
            <!-- Customer Details -->
            <div style="padding: 20px 30px; border-bottom: 1px solid #eee;">
                <h3 style="color: #1a3c2e; margin-top: 0;">Delivery Details</h3>
                <p style="margin: 5px 0;"><strong>{c_name}</strong></p>
                <p style="margin: 5px 0; color: #666;">{address}, {city}</p>
                <p style="margin: 5px 0; color: #666;">{phone}</p>
            </div>
            
            <!-- Order Items -->
            <div style="padding: 20px 30px; border-bottom: 1px solid #eee;">
                <h3 style="color: #1a3c2e; margin-top: 0;">Order Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f8f8;">
                            <th style="padding: 10px; text-align: left;">Product</th>
                            <th style="padding: 10px; text-align: center;">Qty</th>
                            <th style="padding: 10px; text-align: right;">Price</th>
                            <th style="padding: 10px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                <div style="margin-top: 15px; text-align: right;">
                    <p style="margin: 5px 0; color: #666;">Subtotal: Rs. {subtotal:,.2f}</p>
                    <p style="margin: 5px 0; color: #666;">Delivery: Rs. {del_charge:,.2f}</p>
                    <p style="margin: 5px 0; font-size: 18px;"><strong style="color: #1a3c2e;">Total: Rs. {total:,.2f}</strong></p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #1a3c2e; padding: 20px; text-align: center;">
                <p style="color: #a8e8bf; margin: 0 0 10px;">Need help? Contact us</p>
                <p style="color: #c9a227; margin: 0;">WhatsApp: +94 742 975 043</p>
                <p style="color: #7fd4a0; margin: 10px 0 0; font-size: 12px;">© 2026 TRS Products. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


async def send_order_confirmation(order, items) -> bool:
    """Send order confirmation email"""
    if not order or not getattr(order, 'email', None):
        return False
    html = get_order_confirmation_email(order, items)
    return await send_email(
        to_email=order.email,
        to_name=getattr(order, 'customer_name', 'Customer'),
        subject=f"Order Confirmed - {getattr(order, 'order_number', '')} | TRS Products",
        html_content=html,
    )


def get_order_tracking_email(order) -> str:
    """Generate order tracking notification email HTML"""
    raw_status = getattr(order, 'order_status', 'Shipped')
    status_display = raw_status.value if hasattr(raw_status, 'value') else str(raw_status)
    status_formatted = status_display.replace('_', ' ').capitalize()
    
    courier_name = getattr(order, 'courier_name', '')
    courier_html = f'<p style="margin: 6px 0; color: #444;"><strong>Courier / Carrier:</strong> {courier_name}</p>' if courier_name else ''
    
    tracking_url = getattr(order, 'tracking_url', '')
    tracking_link_btn = ""
    if tracking_url:
        tracking_link_btn = f"""
        <div style="margin-top: 20px; text-align: center;">
            <a href="{tracking_url}" target="_blank" style="background: #1a3c2e; color: #c9a227; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-block; font-size: 15px;">Track Shipment Online →</a>
        </div>
        """

    c_name = getattr(order, 'customer_name', 'Customer')
    order_num = getattr(order, 'order_number', 'N/A')
    tracking_id = getattr(order, 'tracking_id', 'N/A')
    address = getattr(order, 'address', '')
    city = getattr(order, 'city', '')
    state = getattr(order, 'state', '')
    frontend_url = settings.FRONTEND_URL or "http://localhost:5173"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Tracking - #{order_num}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1a3c2e, #234d3a); padding: 30px; text-align: center;">
                <h1 style="color: #c9a227; margin: 0; font-size: 28px; letter-spacing: 1px;">TRS IMPORTS</h1>
                <p style="color: #a8e8bf; margin: 5px 0 0;">Quality · Trust · Goodness</p>
            </div>
            
            <!-- Tracking Hero -->
            <div style="padding: 30px; text-align: center; border-bottom: 2px solid #f0f0f0;">
                <div style="width: 60px; height: 60px; background: #d4f5e3; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                    <span style="color: #1a3c2e; font-size: 28px;">🚚</span>
                </div>
                <h2 style="color: #1a3c2e; margin: 0 0 8px;">Your Shipment Tracking Details</h2>
                <p style="color: #666; margin: 0 0 16px;">Hi {c_name}, your order <strong>#{order_num}</strong> tracking details are below:</p>
                
                <div style="background: #fdf8eb; border: 2px dashed #c9a227; border-radius: 10px; padding: 18px 24px; display: inline-block; max-width: 90%; text-align: center;">
                    <span style="display: block; font-size: 12px; font-weight: bold; color: #856404; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Tracking ID / Number</span>
                    <strong style="color: #1a3c2e; font-size: 22px; font-family: monospace; letter-spacing: 2px;">{tracking_id}</strong>
                </div>
                {tracking_link_btn}
            </div>
            
            <!-- Shipment & Delivery Details -->
            <div style="padding: 24px 30px; border-bottom: 1px solid #eee; background: #fafafa;">
                <h3 style="color: #1a3c2e; margin-top: 0; margin-bottom: 12px; font-size: 16px;">Shipment Summary</h3>
                <p style="margin: 6px 0; color: #444;"><strong>Order Number:</strong> #{order_num}</p>
                <p style="margin: 6px 0; color: #444;"><strong>Shipping Status:</strong> <span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 13px;">{status_formatted}</span></p>
                {courier_html}
                <p style="margin: 6px 0; color: #444;"><strong>Delivery Destination:</strong> {address}, {city}{f', {state}' if state else ''}</p>
            </div>

            <!-- Helpful Info -->
            <div style="padding: 20px 30px; border-bottom: 1px solid #eee; font-size: 14px; color: #555; line-height: 1.5;">
                <p style="margin: 0;">You can also check the status of your package anytime in your <strong>TRS Products Account</strong> under <a href="{frontend_url}/account/orders" style="color: #1a3c2e; font-weight: bold; text-decoration: underline;">My Orders</a> or via our <a href="{frontend_url}/track-order" style="color: #1a3c2e; font-weight: bold; text-decoration: underline;">Track Order</a> page.</p>
            </div>
            
            <!-- Footer -->
            <div style="background: #1a3c2e; padding: 20px; text-align: center;">
                <p style="color: #a8e8bf; margin: 0 0 8px;">Thank you for shopping with TRS Products</p>
                <p style="color: #c9a227; margin: 0; font-size: 14px;">WhatsApp Support: +94 742 975 043</p>
                <p style="color: #7fd4a0; margin: 10px 0 0; font-size: 12px;">© 2026 TRS Products. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


async def send_order_tracking_email(order) -> bool:
    """Send order tracking details email to customer"""
    if not order or not getattr(order, "email", None):
        logger.warning("Cannot send tracking email: Order or order.email is missing")
        return False
    html = get_order_tracking_email(order)
    order_num = getattr(order, 'order_number', '')
    return await send_email(
        to_email=order.email,
        to_name=getattr(order, 'customer_name', 'Customer'),
        subject=f"Your TRS Products Order Has Been Shipped - #{order_num}",
        html_content=html,
    )


def get_contact_inquiry_admin_email(inquiry) -> str:
    """Generate HTML email for Admin notification when a contact form/RFQ is submitted"""
    is_rfq = getattr(inquiry, 'inquiry_type', '') == 'bulk_rfq'
    type_label = "Bulk Wholesale RFQ Quotation Request" if is_rfq else "Customer Contact Message"
    type_badge_bg = "#fef3c7" if is_rfq else "#e0f2fe"
    type_badge_color = "#92400e" if is_rfq else "#0369a1"

    rfq_details_html = ""
    if is_rfq:
        rfq_details_html = f"""
        <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px; color: #92400e; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">B2B Wholesale RFQ Specifications:</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                    <td style="padding: 6px 0; color: #666; width: 40%;"><strong>Company / Business:</strong></td>
                    <td style="padding: 6px 0; color: #111;"><strong>{getattr(inquiry, 'company_name', '') or 'N/A'}</strong></td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #666;"><strong>Target Quantity:</strong></td>
                    <td style="padding: 6px 0; color: #111;"><strong>{getattr(inquiry, 'target_qty', '') or 'N/A'}</strong></td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #666;"><strong>Target Price (Per Unit):</strong></td>
                    <td style="padding: 6px 0; color: #111;"><strong>{getattr(inquiry, 'target_price', '') or 'N/A'}</strong></td>
                </tr>
            </table>
        </div>
        """

    frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
    reply_subject = f"Re: {getattr(inquiry, 'subject', 'TRS Products Inquiry')}"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>{type_label} - TRS Products</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
            <!-- Top Brand Header -->
            <div style="background: linear-gradient(135deg, #072d1e 0%, #0d4a32 100%); padding: 28px 32px; text-align: center;">
                <h1 style="color: #c59a3f; margin: 0; font-size: 24px; letter-spacing: 1.5px; font-family: Georgia, serif;">TRS PRODUCTS</h1>
                <p style="color: #d1fae5; margin: 6px 0 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Quality • Trust • Goodness</p>
            </div>

            <!-- Content Container -->
            <div style="padding: 32px;">
                <div style="display: inline-block; background: {type_badge_bg}; color: {type_badge_color}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
                    {type_label}
                </div>

                <h2 style="color: #0f172a; margin: 0 0 8px; font-size: 20px;">
                    New Inquiry from {getattr(inquiry, 'name', 'Customer')}
                </h2>
                <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">
                    Received on {datetime.now().strftime('%d %B %Y at %I:%M %p')}
                </p>

                <!-- Customer Details Card -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; width: 35%;">Name:</td>
                            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{getattr(inquiry, 'name', 'N/A')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Email:</td>
                            <td style="padding: 6px 0;">
                                <a href="mailto:{getattr(inquiry, 'email', '')}" style="color: #072d1e; font-weight: 600; text-decoration: underline;">
                                    {getattr(inquiry, 'email', 'N/A')}
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Phone:</td>
                            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">
                                {getattr(inquiry, 'phone', '') or 'Not provided'}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Subject:</td>
                            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">
                                {getattr(inquiry, 'subject', '') or 'General Inquiry'}
                            </td>
                        </tr>
                    </table>
                </div>

                {rfq_details_html}

                <!-- Message Box -->
                <div style="margin-bottom: 28px;">
                    <h4 style="margin: 0 0 8px; color: #334155; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Message / Request:</h4>
                    <div style="border-left: 4px solid #072d1e; padding: 16px; border-radius: 0 8px 8px 0; background: #f8fafc; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">
{getattr(inquiry, 'message', '')}
                    </div>
                </div>

                <!-- Call to action buttons -->
                <div style="text-align: center; margin: 30px 0 10px;">
                    <a href="mailto:{getattr(inquiry, 'email', '')}?subject={urllib.parse.quote(reply_subject)}" style="background: #072d1e; color: #ffffff; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-block; font-size: 14px; margin-right: 8px;">
                        ✉ Reply Directly to {getattr(inquiry, 'name', 'Customer')}
                    </a>
                    <a href="{frontend_url}/admin/inquiries" style="background: #f1f5f9; color: #072d1e; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-size: 14px; border: 1px solid #cbd5e1;">
                        View in Admin Panel →
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #072d1e; padding: 18px 24px; text-align: center; font-size: 12px; color: #a7f3d0;">
                <p style="margin: 0;">This email was automatically sent from the TRS Products Contact Form.</p>
                <p style="margin: 6px 0 0; color: #c59a3f;">TRS Imports · Quality Trust Goodness</p>
            </div>
        </div>
    </body>
    </html>
    """


def get_contact_inquiry_user_confirmation_email(inquiry) -> str:
    """Generate HTML email to confirm message receipt to customer"""
    is_rfq = getattr(inquiry, 'inquiry_type', '') == 'bulk_rfq'
    c_name = getattr(inquiry, 'name', 'Valued Customer')
    subj = getattr(inquiry, 'subject', 'Inquiry')

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>We Received Your Message - TRS Products</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
            <!-- Brand Header -->
            <div style="background: linear-gradient(135deg, #072d1e 0%, #0d4a32 100%); padding: 28px 32px; text-align: center;">
                <h1 style="color: #c59a3f; margin: 0; font-size: 24px; letter-spacing: 1.5px; font-family: Georgia, serif;">TRS PRODUCTS</h1>
                <p style="color: #d1fae5; margin: 6px 0 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Quality • Trust • Goodness</p>
            </div>

            <div style="padding: 32px; text-align: center;">
                <div style="width: 56px; height: 56px; background: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <span style="color: #072d1e; font-size: 26px;">✓</span>
                </div>

                <h2 style="color: #0f172a; margin: 0 0 10px; font-size: 20px;">Thank You, {c_name}!</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                    We have successfully received your {'bulk wholesale inquiry' if is_rfq else 'message'} regarding <strong>&ldquo;{subj}&rdquo;</strong>.
                </p>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; text-align: left; margin: 0 auto 24px; max-width: 480px;">
                    <p style="margin: 0; font-size: 13px; color: #64748b;">
                        Our {'B2B Wholesale Sales team' if is_rfq else 'Customer Support team'} will review your request and get back to you within <strong>24 business hours</strong>.
                    </p>
                </div>

                <p style="font-size: 13px; color: #64748b; margin: 0 0 20px;">
                    Need immediate assistance? You can also reach our customer support team directly on WhatsApp:
                </p>

                <a href="https://wa.me/94742975043" style="background: #25D366; color: #ffffff; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-block; font-size: 14px;">
                    💬 Chat with us on WhatsApp (+94 742 975 043)
                </a>
            </div>

            <div style="background: #072d1e; padding: 18px 24px; text-align: center; font-size: 12px; color: #a7f3d0;">
                <p style="margin: 0;">Support Email: <a href="mailto:support@trsimports.com" style="color: #c59a3f; text-decoration: none;">support@trsimports.com</a></p>
                <p style="margin: 6px 0 0; color: #c59a3f;">© 2026 TRS Products. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


async def send_contact_inquiry_emails(inquiry) -> bool:
    """Send customer contact inquiry directly to eswaris2109@gmail.com with customer Reply-To, and confirmation to customer"""
    if not inquiry or not getattr(inquiry, 'email', None):
        logger.warning("Cannot send contact email: missing inquiry or customer email")
        return False

    is_rfq = getattr(inquiry, 'inquiry_type', '') == 'bulk_rfq'
    c_name = getattr(inquiry, 'name', 'Customer')
    c_email = str(getattr(inquiry, 'email', '')).strip()
    subj = getattr(inquiry, 'subject', '') or ('Bulk RFQ Quotation Request' if is_rfq else 'Customer Contact Inquiry')

    admin_subject = f"🔔 [TRS Inquiry] {subj} - from {c_name}"
    admin_html = get_contact_inquiry_admin_email(inquiry)

    # 1. Primary admin recipient: eswaris2109@gmail.com
    # Reply-To is set to customer's email so clicking Reply in Gmail replies directly to the customer!
    target_admin_email = "eswaris2109@gmail.com"
    logger.info(f"Dispatching contact inquiry email directly to '{target_admin_email}' with Reply-To '{c_email}'")
    sent = await send_email(
        to_email=target_admin_email,
        to_name="TRS Store Admin",
        subject=admin_subject,
        html_content=admin_html,
        reply_to=c_email,
    )

    # 2. Confirmation acknowledgment email to the customer (only if real customer email, not dummy or self)
    is_dummy_email = any(c_email.lower().endswith(d) for d in ['@example.com', '@test.com', '@sample.com'])
    is_self = (c_email.lower() == target_admin_email.lower())

    if not is_dummy_email and not is_self:
        try:
            user_html = get_contact_inquiry_user_confirmation_email(inquiry)
            await send_email(
                to_email=c_email,
                to_name=c_name,
                subject=f"We received your message - TRS Products",
                html_content=user_html,
                reply_to=target_admin_email,
            )
        except Exception as e:
            logger.warning(f"Note: Failed to send confirmation email to customer '{c_email}': {e}")

    return sent
