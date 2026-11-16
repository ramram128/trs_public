from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Cookie, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from datetime import datetime
import os
import uuid
import shutil

from app.database import get_db
from app.models.address import Address
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem, OrderStatusHistory, OrderStatus, PaymentMethod, PaymentStatus
from app.models.payment import Payment, PaymentGateway
from app.models.product import Product
from app.models.settings import Setting
from app.models.coupon import Coupon
from app.schemas.order import CheckoutAddress, CheckoutRequest, OrderOut, OrderListOut, OrderTrackingResponse, OrderReturnRequest
from app.utils.helpers import generate_order_number, calculate_delivery_charge
from app.utils.email import send_order_confirmation
from app.dependencies.auth import get_current_user, get_optional_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter(prefix="/orders", tags=["Orders"])

os.makedirs("uploads/slips", exist_ok=True)


def get_delivery_settings(db: Session) -> dict:
    settings_map = {}
    settings = db.query(Setting).filter(Setting.group == "delivery").all()
    for s in settings:
        settings_map[s.key] = s.value
    return {
        "enabled": settings_map.get("delivery_enabled", "true") == "true",
        "charge": float(settings_map.get("delivery_charge", "350")),
        "free_above": float(settings_map.get("free_delivery_above", "5000")),
    }


@router.post("/checkout", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def checkout(
    data: CheckoutRequest,
    background_tasks: BackgroundTasks,
    session_id: Optional[str] = Cookie(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    # Get cart
    cart = None
    if current_user:
        cart = db.query(Cart).options(
            joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.images),
            joinedload(Cart.items).joinedload(CartItem.variant),
        ).filter(Cart.user_id == current_user.id).first()
    elif session_id:
        cart = db.query(Cart).options(
            joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.images),
            joinedload(Cart.items).joinedload(CartItem.variant),
        ).filter(Cart.session_id == session_id).first()

    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    if data.address_id is not None:
        if not current_user:
            raise HTTPException(status_code=401, detail="Login required to use a saved address")
        saved = db.query(Address).filter(
            Address.id == data.address_id, Address.user_id == current_user.id
        ).first()
        if not saved:
            raise HTTPException(status_code=404, detail="Address not found")
        checkout_address = CheckoutAddress(
            customer_name=saved.customer_name,
            email=current_user.email,
            phone=saved.phone or "",
            address=saved.address,
            city=saved.city,
            state=saved.state,
            pincode=saved.pincode,
            country=saved.country or "Sri Lanka",
        )
    elif data.address is not None:
        checkout_address = data.address
    else:
        raise HTTPException(status_code=400, detail="Provide either address_id or address")

    subtotal = 0.0
    order_items_data = []

    for item in cart.items:
        product = item.product
        if not product or not product.status:
            continue
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}. Available: {product.stock}")

        # Enforce Minimum Order Quantity (MOQ)
        moq_req = getattr(product, "moq", 1) or 1
        if item.quantity < moq_req:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum order quantity for '{product.name}' is {moq_req}. You have {item.quantity} in cart."
            )

        variant_info = None
        if item.variant_id and item.variant:
            v = item.variant
            variant_info = f"{v.variant_type}: {v.variant_value}"

        main_img = next((img for img in product.images if img.is_main), None)
        if not main_img and product.images:
            main_img = product.images[0]

        # Calculate unit price considering bulk wholesale tiers if configured
        unit_price = product.final_price
        bulk_tiers = getattr(product, "bulk_tiers", None)
        if bulk_tiers and isinstance(bulk_tiers, list):
            try:
                sorted_tiers = sorted(bulk_tiers, key=lambda t: int(t.get("min_qty", 0)), reverse=True)
                for tier in sorted_tiers:
                    min_q = int(tier.get("min_qty", 0))
                    if item.quantity >= min_q:
                        if "unit_price" in tier and tier["unit_price"] is not None:
                            unit_price = float(tier["unit_price"])
                            break
                        elif "discount_percent" in tier and tier["discount_percent"] is not None:
                            unit_price = round(product.price * (1 - float(tier["discount_percent"]) / 100), 2)
                            break
            except Exception:
                unit_price = product.final_price

        item_total = round(unit_price * item.quantity, 2)
        subtotal += item_total
        order_items_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "product_sku": product.sku,
            "product_image": main_img.image_url if main_img else None,
            "variant_info": variant_info,
            "unit_price": unit_price,
            "quantity": item.quantity,
            "total": item_total,
            "stock_to_deduct": item.quantity,
        })

    # Validate and apply coupon if provided
    discount_amount = 0.0
    applied_coupon_code = None

    if data.coupon_code and data.coupon_code.strip():
        code_str = data.coupon_code.strip().upper()
        coupon = db.query(Coupon).filter(
            Coupon.code == code_str,
            Coupon.is_active == True,
        ).first()

        if coupon:
            now = datetime.now()
            coupon_valid = True
            if coupon.start_date and coupon.start_date > now:
                coupon_valid = False
            if coupon.end_date and coupon.end_date < now:
                coupon_valid = False
            if coupon.usage_limit and (coupon.used_count or 0) >= coupon.usage_limit:
                coupon_valid = False
            if coupon.min_order_amount and subtotal < coupon.min_order_amount:
                coupon_valid = False

            if coupon_valid:
                if coupon.discount_type == "percent":
                    discount_amount = round((subtotal * coupon.discount_value) / 100, 2)
                    if coupon.max_discount_amount and discount_amount > coupon.max_discount_amount:
                        discount_amount = float(coupon.max_discount_amount)
                else:
                    discount_amount = float(coupon.discount_value)

                discount_amount = min(discount_amount, subtotal)
                applied_coupon_code = coupon.code
                coupon.used_count = (coupon.used_count or 0) + 1

    delivery_settings = get_delivery_settings(db)
    delivery_charge = calculate_delivery_charge(
        subtotal=subtotal,
        free_delivery_above=delivery_settings["free_above"],
        delivery_charge=delivery_settings["charge"],
        delivery_enabled=delivery_settings["enabled"],
    )

    total = max(0.0, subtotal - discount_amount + delivery_charge)

    last_order = db.query(Order).order_by(Order.id.desc()).first()
    order_number = generate_order_number(last_order.id if last_order else 0)

    # Map payment method string to enum
    payment_method_map = {
        "cod": PaymentMethod.cod,
        "online": PaymentMethod.online,
        "card": PaymentMethod.online,
        "bank": PaymentMethod.bank_transfer,
        "bank_transfer": PaymentMethod.bank_transfer,
        "wallet": PaymentMethod.online,
    }
    payment_method = payment_method_map.get(data.payment_method, PaymentMethod.cod)

    order = Order(
        order_number=order_number,
        user_id=current_user.id if current_user else None,
        customer_name=checkout_address.customer_name,
        email=checkout_address.email,
        phone=checkout_address.phone,
        address=checkout_address.address,
        city=checkout_address.city,
        state=checkout_address.state,
        pincode=checkout_address.pincode,
        country=checkout_address.country,
        subtotal=round(subtotal, 2),
        discount_amount=round(discount_amount, 2),
        coupon_code=applied_coupon_code,
        delivery_charge=delivery_charge,
        total=round(total, 2),
        payment_method=payment_method,
        payment_status=PaymentStatus.pending,
        bank_slip_url=data.bank_slip_url,
        order_status=OrderStatus.pending,
        notes=data.notes,
    )
    db.add(order)
    db.flush()

    for item_data in order_items_data:
        stock_to_deduct = item_data.pop("stock_to_deduct")
        order_item = OrderItem(order_id=order.id, **item_data)
        db.add(order_item)
        db.query(Product).filter(Product.id == item_data["product_id"]).update(
            {"stock": Product.stock - stock_to_deduct}
        )

    history_note = "Order placed successfully"
    if applied_coupon_code:
        history_note += f" (Coupon: {applied_coupon_code}, Saved: Rs. {discount_amount})"
    if payment_method == PaymentMethod.bank_transfer:
        history_note += " via Direct Bank Transfer"

    history = OrderStatusHistory(
        order_id=order.id, status=OrderStatus.pending,
        note=history_note, created_by="system",
    )
    db.add(history)

    # Select payment gateway enum
    if payment_method == PaymentMethod.cod:
        gateway = PaymentGateway.cod
    elif payment_method == PaymentMethod.bank_transfer:
        gateway = PaymentGateway.bank_transfer
    else:
        gateway = PaymentGateway.payhere

    payment = Payment(
        order_id=order.id,
        gateway=gateway,
        payment_type=data.payment_method if data.payment_method != "cod" else None,
        amount=round(total, 2), currency="LKR", status="pending",
    )
    db.add(payment)

    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    
    # Create Admin Notification
    notif = Notification(
        type="order",
        title="New Order Received",
        message=f"Order #{order.order_number} placed by {order.customer_name} for Rs. {order.total} ({data.payment_method.upper()})",
        related_id=order.order_number
    )
    db.add(notif)
    
    db.commit()
    db.refresh(order)

    order_with_items = db.query(Order).options(
        joinedload(Order.items), joinedload(Order.status_history),
    ).filter(Order.id == order.id).first()

    background_tasks.add_task(send_order_confirmation, order_with_items, order_with_items.items)

    return OrderOut.model_validate(order_with_items)


@router.get("", response_model=List[OrderListOut])
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    result = []
    for order in orders:
        out = OrderListOut.model_validate(order)
        out.item_count = len(order.items)
        result.append(out)
    return result


@router.get("/track/{identifier}")
async def track_order(identifier: str, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.status_history))
        .filter(
            (Order.order_number == identifier) |
            (Order.email == identifier) |
            (Order.phone == identifier)
        )
        .order_by(Order.created_at.desc())
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "order_number": order.order_number,
        "customer_name": order.customer_name,
        "order_status": order.order_status.value,
        "payment_status": order.payment_status.value,
        "tracking_id": order.tracking_id,
        "courier_name": order.courier_name,
        "tracking_url": order.tracking_url,
        "created_at": order.created_at.isoformat(),
        "status_history": [
            {"id": h.id, "status": h.status.value, "note": h.note,
             "created_by": h.created_by, "created_at": h.created_at.isoformat()}
            for h in order.status_history
        ],
        "items": [
            {"id": i.id, "product_id": i.product_id, "product_name": i.product_name,
             "product_sku": i.product_sku, "product_image": i.product_image,
             "variant_info": i.variant_info, "unit_price": i.unit_price,
             "quantity": i.quantity, "total": i.total}
            for i in order.items
        ],
        "total": order.total,
    }


@router.get("/{order_number}", response_model=OrderOut)
async def get_order(
    order_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.status_history))
        .filter(Order.order_number == order_number)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    return OrderOut.model_validate(order)


@router.post("/{order_number}/cancel")
async def cancel_order(
    order_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.order_number == order_number)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if order.order_status not in (OrderStatus.pending, OrderStatus.confirmed):
        raise HTTPException(
            status_code=400,
            detail="Order can only be cancelled when it is pending or confirmed"
        )

    # Restore stock
    for item in order.items:
        if item.product_id:
            db.query(Product).filter(Product.id == item.product_id).update(
                {"stock": Product.stock + item.quantity}
            )

    order.order_status = OrderStatus.cancelled
    history = OrderStatusHistory(
        order_id=order.id,
        status=OrderStatus.cancelled,
        note="Cancelled by customer",
        created_by=current_user.email,
    )
    db.add(history)
    db.commit()

    return {"message": "Order cancelled successfully"}


@router.post("/{order_number}/return")
async def request_order_return(
    order_number: str,
    data: OrderReturnRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Customer submits return/exchange request for a delivered order"""
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if order.order_status != OrderStatus.delivered:
        raise HTTPException(status_code=400, detail="Return can only be requested for delivered orders")

    order.order_status = OrderStatus.return_requested
    order.return_reason = data.reason
    order.return_status = "requested"

    history = OrderStatusHistory(
        order_id=order.id,
        status=OrderStatus.return_requested,
        note=f"Return requested by customer. Reason: {data.reason}",
        created_by=current_user.email,
    )
    db.add(history)

    notif = Notification(
        type="order",
        title="Order Return Requested",
        message=f"Customer {order.customer_name} requested return for order #{order.order_number}",
        related_id=order.order_number
    )
    db.add(notif)
    db.commit()

    return {"message": "Return request submitted successfully. Our support team will review it."}


@router.post("/{order_number}/bank-slip")
async def upload_bank_slip(
    order_number: str,
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Upload bank deposit slip for Bank Transfer payment"""
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user and order.user_id and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validate file type
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPG, PNG, WEBP, PDF")

    filename = f"slip_{order.order_number}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join("uploads", "slips", filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    slip_url = f"/uploads/slips/{filename}"
    order.bank_slip_url = slip_url

    history = OrderStatusHistory(
        order_id=order.id,
        status=order.order_status,
        note="Customer uploaded bank deposit slip",
        created_by=current_user.email if current_user else "Customer",
    )
    db.add(history)

    notif = Notification(
        type="order",
        title="Bank Deposit Slip Uploaded",
        message=f"Deposit slip uploaded for order #{order.order_number}",
        related_id=order.order_number
    )
    db.add(notif)
    db.commit()

    return {"message": "Bank deposit slip uploaded successfully", "bank_slip_url": slip_url}

