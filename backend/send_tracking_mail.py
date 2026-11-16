"""
TRS Products - Tracking Email Sender Script
This script sends tracking details and tracking link directly to the customer's email.

Usage:
  1. Send for specific order in DB:
     python send_tracking_mail.py --order-id 5

  2. Send custom tracking email:
     python send_tracking_mail.py --to eswaris2109@gmail.com --name "Eswari" --order-num "ORD-20260917-0005" --tracking-id "TRS222222" --courier "Domex" --url "https://domex.lk/track/TRS222222"

  3. Interactive Mode (prompts for input):
     python send_tracking_mail.py
"""

import os
import sys
import argparse
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.database import SessionLocal
from app.models.order import Order


def build_tracking_html(
    customer_name: str,
    order_number: str,
    tracking_id: str,
    courier_name: str = "",
    tracking_url: str = "",
    delivery_address: str = "",
    order_status: str = "Shipped",
    frontend_url: str = "http://localhost:5173"
) -> str:
    """Generate responsive, beautiful HTML email template with tracking button"""
    
    courier_html = f'<p style="margin: 6px 0; color: #444;"><strong>Courier / Carrier:</strong> {courier_name}</p>' if courier_name else ''
    
    tracking_link_btn = ""
    if tracking_url:
        tracking_link_btn = f"""
        <div style="margin-top: 22px; text-align: center;">
            <a href="{tracking_url}" target="_blank" style="background: #1a3c2e; color: #c9a227; font-weight: bold; padding: 14px 30px; border-radius: 8px; text-decoration: none; display: inline-block; font-size: 15px; box-shadow: 0 4px 12px rgba(26,60,46,0.25); letter-spacing: 0.5px;">Track Shipment Online →</a>
        </div>
        """

    address_html = f'<p style="margin: 6px 0; color: #444;"><strong>Delivery Destination:</strong> {delivery_address}</p>' if delivery_address else ''

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Tracking - #{order_number}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,0.08);">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #1a3c2e, #234d3a); padding: 32px 20px; text-align: center;">
                <h1 style="color: #c9a227; margin: 0; font-size: 26px; letter-spacing: 2px; text-transform: uppercase;">TRS IMPORTS</h1>
                <p style="color: #a8e8bf; margin: 6px 0 0; font-size: 13px; letter-spacing: 1px;">Quality · Trust · Goodness</p>
            </div>
            
            <!-- Hero Tracking Box -->
            <div style="padding: 30px 24px; text-align: center; border-bottom: 2px solid #f0f0f0;">
                <div style="width: 64px; height: 64px; background: #e8f8f0; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 30px;">
                    🚚
                </div>
                <h2 style="color: #1a3c2e; margin: 0 0 8px; font-size: 22px;">Your Order Has Been Shipped!</h2>
                <p style="color: #555; margin: 0 0 18px; font-size: 14px;">Hi <strong>{customer_name}</strong>, your order <strong>#{order_number}</strong> is on its way to you.</p>
                
                <div style="background: #fdfaf0; border: 2px dashed #c9a227; border-radius: 10px; padding: 18px 24px; display: inline-block; max-width: 90%; text-align: center;">
                    <span style="display: block; font-size: 11px; font-weight: bold; color: #856404; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Tracking ID / Number</span>
                    <strong style="color: #1a3c2e; font-size: 24px; font-family: monospace; letter-spacing: 3px;">{tracking_id}</strong>
                </div>
                {tracking_link_btn}
            </div>
            
            <!-- Shipment Summary -->
            <div style="padding: 24px 30px; border-bottom: 1px solid #eee; background: #fafafa; font-size: 14px;">
                <h3 style="color: #1a3c2e; margin-top: 0; margin-bottom: 14px; font-size: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px;">Shipment Details</h3>
                <p style="margin: 6px 0; color: #444;"><strong>Order Number:</strong> #{order_number}</p>
                <p style="margin: 6px 0; color: #444;"><strong>Shipping Status:</strong> <span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 3px 10px; border-radius: 4px; font-weight: 600; font-size: 12px; text-transform: uppercase;">{order_status}</span></p>
                {courier_html}
                {address_html}
            </div>

            <!-- Helpful Info -->
            <div style="padding: 20px 30px; border-bottom: 1px solid #eee; font-size: 13px; color: #666; line-height: 1.6;">
                <p style="margin: 0;">You can also check the status of your order anytime in your <strong>TRS Products Account</strong> under <a href="{frontend_url}/account/orders" style="color: #1a3c2e; font-weight: bold; text-decoration: underline;">My Orders</a> or via our <a href="{frontend_url}/track-order" style="color: #1a3c2e; font-weight: bold; text-decoration: underline;">Track Order</a> page.</p>
            </div>
            
            <!-- Footer -->
            <div style="background: #1a3c2e; padding: 22px; text-align: center;">
                <p style="color: #a8e8bf; margin: 0 0 6px; font-size: 13px;">Thank you for shopping with TRS Products</p>
                <p style="color: #c9a227; margin: 0; font-size: 13px;">WhatsApp Support: <strong>+94 742 975 043</strong></p>
                <p style="color: #7fd4a0; margin: 12px 0 0; font-size: 11px;">© 2026 TRS Products. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


def send_mail(
    to_email: str,
    to_name: str,
    subject: str,
    html_content: str,
    smtp_host: str = None,
    smtp_port: int = None,
    smtp_user: str = None,
    smtp_password: str = None,
    from_email: str = None,
    from_name: str = "TRS Products",
) -> bool:
    """Send email via SMTP"""
    host = smtp_host or settings.SMTP_HOST or "smtp.gmail.com"
    port = smtp_port or settings.SMTP_PORT or 587
    user = smtp_user or settings.SMTP_USER or "eswariinpand@gmail.com"
    password = smtp_password or settings.SMTP_PASSWORD
    sender_email = from_email or settings.FROM_EMAIL or user
    sender_name = from_name or settings.FROM_NAME or "TRS Products"

    print("=" * 60)
    print(f"Connecting to SMTP Server: {host}:{port}")
    print(f"Sender: {sender_name} <{sender_email}>")
    print(f"Recipient: {to_name} <{to_email}>")
    print(f"Subject: {subject}")
    print("=" * 60)

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = formataddr((sender_name, sender_email))
        msg["To"] = formataddr((to_name, to_email)) if to_name else to_email

        html_part = MIMEText(html_content, "html", "utf-8")
        msg.attach(html_part)

        server = smtplib.SMTP(host, port, timeout=15)
        server.starttls()

        if user and password:
            print(f"Authenticating as {user}...")
            server.login(user, password)
            print("✓ SMTP Authentication Successful!")

        print("Sending message...")
        server.sendmail(sender_email, [to_email], msg.as_string())
        server.quit()
        print(f"🎉 SUCCESS! Email successfully sent to {to_email}")
        print("=" * 60)
        return True

    except smtplib.SMTPAuthenticationError as auth_err:
        print("\n❌ SMTP AUTHENTICATION FAILED:")
        print(f"   {auth_err}")
        print("\n👉 REASON: Google rejected the password because it requires a 16-character App Password.")
        print("👉 FIX: Go to https://myaccount.google.com/apppasswords, create an App Password, and put it in backend/.env")
        print("=" * 60)
        return False
    except Exception as e:
        print(f"\n❌ ERROR SENDING EMAIL: {e}")
        print("=" * 60)
        return False


def main():
    parser = argparse.ArgumentParser(description="Send order tracking email to customer")
    parser.add_argument("--order-id", type=int, help="Order ID in database")
    parser.add_argument("--to", type=str, help="Recipient customer email")
    parser.add_argument("--name", type=str, default="Customer", help="Customer name")
    parser.add_argument("--order-num", type=str, default="ORD-2026-0001", help="Order number")
    parser.add_argument("--tracking-id", type=str, help="Courier tracking ID")
    parser.add_argument("--courier", type=str, default="", help="Courier/carrier name")
    parser.add_argument("--url", type=str, default="", help="Tracking web link")
    parser.add_argument("--address", type=str, default="", help="Delivery address")
    parser.add_argument("--password", type=str, help="Override SMTP App Password for this send")

    args = parser.parse_args()

    # Case 1: Fetch from Database
    if args.order_id:
        db = SessionLocal()
        order = db.query(Order).filter(Order.id == args.order_id).first()
        db.close()

        if not order:
            print(f"❌ Order #{args.order_id} not found in database.")
            sys.exit(1)

        to_email = order.email
        to_name = order.customer_name
        order_num = order.order_number
        tracking_id = order.tracking_id or "TRS" + str(order.id).zfill(6)
        courier = order.courier_name or "Courier Service"
        tracking_url = order.tracking_url or f"{settings.FRONTEND_URL}/track-order"
        address = f"{order.address}, {order.city}"
        status = order.order_status.value if hasattr(order.order_status, "value") else str(order.order_status)
    elif args.to:
        to_email = args.to
        to_name = args.name
        order_num = args.order_num
        tracking_id = args.tracking_id or "TRS888888"
        courier = args.courier or "Courier Partner"
        tracking_url = args.url or f"{settings.FRONTEND_URL}/track-order"
        address = args.address or "Colombo, Sri Lanka"
        status = "Shipped"
    else:
        print("\n--- TRS Products Tracking Email Sender ---")
        to_email = input("Recipient Email (e.g. eswaris2109@gmail.com): ").strip()
        if not to_email:
            to_email = "eswaris2109@gmail.com"
        to_name = input("Customer Name [Eswari]: ").strip() or "Eswari"
        order_num = input("Order Number [ORD-20260917-0005]: ").strip() or "ORD-20260917-0005"
        tracking_id = input("Tracking ID [TRS333333]: ").strip() or "TRS333333"
        courier = input("Courier Name [Domex]: ").strip() or "Domex"
        tracking_url = input("Tracking URL [https://domex.lk/track]: ").strip() or "https://domex.lk/track"
        address = input("Delivery Address [Dindigul, Tamil Nadu]: ").strip() or "Dindigul, Tamil Nadu"
        status = "Shipped"

    subject = f"Your TRS Products Order Has Been Shipped - #{order_num}"
    html = build_tracking_html(
        customer_name=to_name,
        order_number=order_num,
        tracking_id=tracking_id,
        courier_name=courier,
        tracking_url=tracking_url,
        delivery_address=address,
        order_status=status,
        frontend_url=settings.FRONTEND_URL or "http://localhost:5173",
    )

    send_mail(
        to_email=to_email,
        to_name=to_name,
        subject=subject,
        html_content=html,
        smtp_password=args.password,
    )


if __name__ == "__main__":
    main()
