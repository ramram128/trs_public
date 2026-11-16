from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.payment import Payment, PaymentStatusEnum
from app.dependencies.auth import get_optional_user, get_current_admin
import sqlalchemy.orm
from app.models.user import User
from app.config import settings
import hashlib
import httpx

router = APIRouter(prefix="/payments", tags=["Payments"])


class CreatePayhereSessionRequest(BaseModel):
    order_number: str


def generate_payhere_hash(
    merchant_id: str,
    order_id: str,
    amount: str,
    currency: str,
    merchant_secret: str,
) -> str:
    """Generate PayHere MD5 hash for payment verification"""
    secret_hash = hashlib.md5(merchant_secret.encode()).hexdigest().upper()
    hash_str = f"{merchant_id}{order_id}{amount}{currency}{secret_hash}"
    return hashlib.md5(hash_str.encode()).hexdigest().upper()


@router.post("/create-payhere-session")
async def create_payhere_session(
    data: CreatePayhereSessionRequest,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Create PayHere payment session for an order"""
    order = db.query(Order).filter(Order.order_number == data.order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.payment_status == PaymentStatus.paid:
        raise HTTPException(status_code=400, detail="Order already paid")

    amount = f"{order.total:.2f}"
    currency = "LKR"

    hash_value = generate_payhere_hash(
        merchant_id=settings.PAYHERE_MERCHANT_ID or "TEST_MERCHANT",
        order_id=order.order_number,
        amount=amount,
        currency=currency,
        merchant_secret=settings.PAYHERE_MERCHANT_SECRET or "TEST_SECRET",
    )

    return {
        "merchant_id": settings.PAYHERE_MERCHANT_ID or "TEST_MERCHANT",
        "return_url": f"{settings.FRONTEND_URL}/order-confirmation/{order.order_number}",
        "cancel_url": f"{settings.FRONTEND_URL}/checkout?order={order.order_number}&cancelled=true",
        "notify_url": f"{settings.API_URL}/api/payments/payhere-notify",
        "order_id": order.order_number,
        "items": f"Order {order.order_number} - TRS Products",
        "currency": currency,
        "amount": amount,
        "first_name": order.customer_name.split()[0],
        "last_name": " ".join(order.customer_name.split()[1:]) or ".",
        "email": order.email,
        "phone": order.phone,
        "address": order.address,
        "city": order.city,
        "country": order.country,
        "hash": hash_value,
        "sandbox": settings.PAYHERE_SANDBOX,
        "checkout_url": settings.PAYHERE_API_URL,
    }


@router.post("/payhere-notify")
async def payhere_notify(request: Request, db: Session = Depends(get_db)):
    """Handle PayHere payment notification (webhook)"""
    form_data = await request.form()

    merchant_id = form_data.get("merchant_id")
    order_id = form_data.get("order_id")
    payment_id = form_data.get("payment_id")
    payhere_amount = form_data.get("payhere_amount")
    payhere_currency = form_data.get("payhere_currency")
    status_code = form_data.get("status_code")
    md5sig = form_data.get("md5sig")

    # Verify hash
    expected_hash = generate_payhere_hash(
        merchant_id=merchant_id,
        order_id=order_id,
        amount=payhere_amount,
        currency=payhere_currency,
        merchant_secret=settings.PAYHERE_MERCHANT_SECRET or "TEST_SECRET",
    )

    if md5sig != expected_hash:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Update order based on status code
    order = db.query(Order).filter(Order.order_number == order_id).first()
    if not order:
        return {"message": "Order not found"}

    payment = db.query(Payment).filter(Payment.order_id == order.id).first()

    if status_code == "2":  # Success
        order.payment_status = PaymentStatus.paid
        order.order_status = OrderStatus.confirmed
        if payment:
            payment.transaction_id = payment_id
            payment.status = PaymentStatusEnum.completed
            payment.gateway_response = dict(form_data)
    elif status_code in ["-1", "-2", "-3"]:  # Failed/Cancelled/Chargedback
        order.payment_status = PaymentStatus.failed
        if payment:
            payment.status = PaymentStatusEnum.failed
            payment.gateway_response = dict(form_data)

    db.commit()
    return {"message": "OK"}


@router.get("/verify/{order_number}")
async def verify_payment(
    order_number: str,
    db: Session = Depends(get_db),
):
    """Check payment status for an order"""
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "order_number": order.order_number,
        "payment_status": order.payment_status,
        "order_status": order.order_status,
        "total": order.total,
    }


@router.get("/admin")
async def get_all_payments(
    page: int = 1,
    per_page: int = 20,
    search: str = None,
    status: str = None,
    method: str = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin), # Need to import get_current_admin above
):
    """Get all payments for admin"""
    query = db.query(Payment).options(
        sqlalchemy.orm.joinedload(Payment.order)
    )

    if status:
        query = query.filter(Payment.status == status)
    if method:
        query = query.filter(Payment.gateway == method)
    if search:
        query = query.join(Order).filter(
            (Payment.transaction_id.ilike(f"%{search}%")) |
            (Order.order_number.ilike(f"%{search}%")) |
            (Order.customer_name.ilike(f"%{search}%"))
        )

    total = query.count()
    payments = query.order_by(Payment.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for p in payments:
        result.append({
            "id": p.id,
            "transaction_id": p.transaction_id,
            "order_number": p.order.order_number if p.order else None,
            "customer_name": p.order.customer_name if p.order else None,
            "amount": float(p.amount),
            "currency": p.currency,
            "gateway": p.gateway.value if p.gateway else None,
            "status": p.status.value if p.status else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })

    return {"items": result, "total": total, "page": page, "per_page": per_page}
