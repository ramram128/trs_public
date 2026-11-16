from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.models.order import Order, OrderItem, OrderStatusHistory, OrderStatus, PaymentStatus
from app.models.product import Product
from app.models.category import Category
from app.models.payment import Payment
from app.schemas.order import OrderOut, OrderListOut, OrderStatusUpdate, PaymentStatusUpdate, OrderTrackingUpdate
from app.dependencies.auth import get_current_admin
from app.utils.email import send_order_tracking_email, is_email_configured

router = APIRouter(prefix="/admin", tags=["Admin"])


# ---- DASHBOARD ----
@router.get("/dashboard")
async def get_dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Admin dashboard statistics"""
    # Basic counts
    total_orders = db.query(func.count(Order.id)).scalar()
    total_customers = db.query(func.count(User.id)).filter(User.role == UserRole.customer).scalar()
    total_products = db.query(func.count(Product.id)).scalar()
    total_categories = db.query(func.count(Category.id)).scalar()

    # Order status counts
    pending_orders = db.query(func.count(Order.id)).filter(Order.order_status == OrderStatus.pending).scalar()
    confirmed_orders = db.query(func.count(Order.id)).filter(Order.order_status == OrderStatus.confirmed).scalar()
    delivered_orders = db.query(func.count(Order.id)).filter(Order.order_status == OrderStatus.delivered).scalar()

    # Revenue
    total_revenue = db.query(func.sum(Order.total)).filter(
        Order.payment_status == PaymentStatus.paid
    ).scalar() or 0

    # Monthly revenue (last 6 months)
    monthly_revenue = []
    for i in range(5, -1, -1):
        month_start = datetime.now().replace(day=1) - timedelta(days=30 * i)
        month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        rev = db.query(func.sum(Order.total)).filter(
            Order.payment_status == PaymentStatus.paid,
            Order.created_at >= month_start,
            Order.created_at < month_end,
        ).scalar() or 0
        monthly_revenue.append({
            "month": month_start.strftime("%b %Y"),
            "revenue": float(rev),
        })

    # Recent orders
    recent_orders = db.query(Order).options(
        joinedload(Order.items)
    ).order_by(Order.created_at.desc()).limit(10).all()

    # Low stock products
    low_stock = db.query(Product).filter(
        Product.stock <= Product.low_stock_threshold, Product.status == True
    ).limit(10).all()

    return {
        "stats": {
            "total_orders": total_orders,
            "total_customers": total_customers,
            "total_products": total_products,
            "total_categories": total_categories,
            "pending_orders": pending_orders,
            "confirmed_orders": confirmed_orders,
            "delivered_orders": delivered_orders,
            "total_revenue": float(total_revenue),
        },
        "monthly_revenue": monthly_revenue,
        "recent_orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer_name": o.customer_name,
                "total": o.total,
                "order_status": o.order_status.value if hasattr(o.order_status, "value") else str(o.order_status),
                "payment_status": o.payment_status.value if hasattr(o.payment_status, "value") else str(o.payment_status),
                "tracking_id": o.tracking_id,
                "courier_name": o.courier_name,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "item_count": len(o.items) if o.items else 0,
            }
            for o in recent_orders
        ],
        "low_stock_products": [
            {"id": p.id, "name": p.name, "stock": p.stock, "threshold": p.low_stock_threshold}
            for p in low_stock
        ],
    }


# ---- ORDERS ----
@router.get("/orders", response_model=dict)
async def get_all_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    order_status: Optional[str] = None,
    payment_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Get all orders with filters (admin)"""
    query = db.query(Order).options(joinedload(Order.items))

    if order_status:
        query = query.filter(Order.order_status == order_status)
    if payment_status:
        query = query.filter(Order.payment_status == payment_status)
    if search:
        query = query.filter(
            (Order.order_number.ilike(f"%{search}%")) |
            (Order.customer_name.ilike(f"%{search}%")) |
            (Order.email.ilike(f"%{search}%")) |
            (Order.phone.ilike(f"%{search}%"))
        )

    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer_name": o.customer_name,
                "email": o.email,
                "phone": o.phone,
                "total": o.total,
                "payment_method": o.payment_method.value if hasattr(o.payment_method, "value") else str(o.payment_method),
                "payment_status": o.payment_status.value if hasattr(o.payment_status, "value") else str(o.payment_status),
                "order_status": o.order_status.value if hasattr(o.order_status, "value") else str(o.order_status),
                "tracking_id": o.tracking_id,
                "courier_name": o.courier_name,
                "item_count": len(o.items) if o.items else 0,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in orders
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


@router.get("/orders/{order_id}", response_model=OrderOut)
async def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Get order details (admin)"""
    order = db.query(Order).options(
        joinedload(Order.items),
        joinedload(Order.status_history),
        joinedload(Order.payment),
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderOut.model_validate(order)


@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update order status (admin)"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.order_status = data.status

    # Auto-update payment status for COD on delivery
    if data.status == OrderStatus.delivered and order.payment_method.value == "cod":
        order.payment_status = PaymentStatus.paid

    history = OrderStatusHistory(
        order_id=order.id,
        status=data.status,
        note=data.note,
        created_by=current_admin.email,
    )
    db.add(history)
    db.commit()
    return {"message": f"Order status updated to {data.status}"}


@router.put("/orders/{order_id}/payment-status")
async def update_payment_status(
    order_id: int,
    data: PaymentStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update payment status (admin)"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.payment_status = data.status
    db.commit()
    return {"message": f"Payment status updated to {data.status}"}


@router.patch("/orders/{order_id}/tracking")
@router.put("/orders/{order_id}/tracking")
async def update_order_tracking(
    order_id: int,
    data: OrderTrackingUpdate,
    background_tasks: BackgroundTasks,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update order tracking ID and courier info, and send email notification (admin)"""
    order = db.query(Order).options(
        joinedload(Order.items),
        joinedload(Order.status_history),
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_tracking_id = (order.tracking_id or "").strip()
    new_tracking_id = (data.tracking_id or "").strip() if data.tracking_id is not None else old_tracking_id

    is_new_or_changed = bool(new_tracking_id and new_tracking_id != old_tracking_id)

    order.tracking_id = new_tracking_id if new_tracking_id else None
    if data.courier_name is not None:
        order.courier_name = data.courier_name.strip() if data.courier_name.strip() else None
    if data.tracking_url is not None:
        order.tracking_url = data.tracking_url.strip() if data.tracking_url.strip() else None

    # Optional status update (e.g. to "shipped")
    if data.order_status and data.order_status in [s.value for s in OrderStatus]:
        new_status = OrderStatus(data.order_status)
        if order.order_status != new_status:
            order.order_status = new_status
            history = OrderStatusHistory(
                order_id=order.id,
                status=new_status,
                note=f"Status updated to {new_status.value} with tracking details (Tracking ID: {order.tracking_id or 'N/A'})",
                created_by=current_admin.email,
            )
            db.add(history)

    db.commit()
    db.refresh(order)

    # Email rule: Send only when tracking ID is present and it is either new/changed or explicitly requested
    email_sent = False
    email_note = None
    if order.tracking_id and (is_new_or_changed or data.notify_customer):
        if is_email_configured():
            background_tasks.add_task(send_order_tracking_email, order)
            email_sent = True
        else:
            email_note = "Email not sent because SMTP credentials are not configured in backend/.env"

    if email_sent:
        msg = f"Tracking ID updated and notification email sent to {order.email}"
    elif email_note:
        msg = f"Tracking ID updated, but email not sent (SMTP not configured in backend/.env)"
    else:
        msg = "Tracking ID updated successfully"

    return {
        "success": True,
        "message": msg,
        "tracking_id": order.tracking_id,
        "courier_name": order.courier_name,
        "tracking_url": order.tracking_url,
        "order_status": order.order_status.value if hasattr(order.order_status, "value") else str(order.order_status),
        "email_sent": email_sent,
        "email_note": email_note,
    }


@router.post("/orders/{order_id}/send-tracking-email")
async def resend_tracking_email(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Manually resend shipment tracking email to customer (admin)"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if not order.tracking_id:
        raise HTTPException(status_code=400, detail="Order does not have a Tracking ID assigned yet")
    if not order.email:
        raise HTTPException(status_code=400, detail="Order does not have a customer email address")

    if not is_email_configured():
        raise HTTPException(
            status_code=400,
            detail="Email provider is not configured! Please configure SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in backend/.env"
        )

    sent = await send_order_tracking_email(order)
    if not sent:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email to {order.email}. Please check SMTP credentials in backend/.env or server logs."
        )

    return {
        "success": True,
        "message": f"Tracking email sent successfully to {order.email}",
        "email": order.email,
        "tracking_id": order.tracking_id,
    }


# ---- CUSTOMERS ----
@router.get("/customers")
async def get_all_customers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Get all customers (admin)"""
    query = db.query(User).filter(User.role == UserRole.customer)

    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (User.phone.ilike(f"%{search}%"))
        )
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    customers = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for c in customers:
        order_count = db.query(func.count(Order.id)).filter(Order.user_id == c.id).scalar()
        total_spent = db.query(func.sum(Order.total)).filter(
            Order.user_id == c.id, Order.payment_status == PaymentStatus.paid
        ).scalar() or 0
        result.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "is_active": c.is_active,
            "order_count": order_count,
            "total_spent": float(total_spent),
            "created_at": c.created_at.isoformat(),
        })

    return {"items": result, "total": total, "page": page, "per_page": per_page}


@router.put("/customers/{customer_id}/toggle-status")
async def toggle_customer_status(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Enable/disable customer account (admin)"""
    customer = db.query(User).filter(User.id == customer_id, User.role == UserRole.customer).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer.is_active = not customer.is_active
    db.commit()
    return {"message": f"Customer {'enabled' if customer.is_active else 'disabled'}", "is_active": customer.is_active}


# ---- INVENTORY ----
@router.get("/inventory")
async def get_inventory(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Get inventory for low stock management (admin)"""
    query = db.query(Product).options(joinedload(Product.category))

    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.sku.ilike(f"%{search}%"))
        )
    if status == "low_stock":
        query = query.filter(Product.stock <= Product.low_stock_threshold, Product.stock > 0)
    elif status == "out_of_stock":
        query = query.filter(Product.stock == 0)

    total = query.count()
    products = query.order_by(Product.stock.asc()).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for p in products:
        result.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "stock": p.stock,
            "low_stock_threshold": p.low_stock_threshold,
            "category_name": p.category.name if p.category else None,
            "status": "out_of_stock" if p.stock == 0 else ("low_stock" if p.stock <= p.low_stock_threshold else "in_stock")
        })

    return {"items": result, "total": total, "page": page, "per_page": per_page}


class QuickStockUpdate(BaseModel):
    stock: int


@router.patch("/inventory/{product_id}/stock")
@router.put("/inventory/{product_id}/stock")
async def update_product_stock_quick(
    product_id: int,
    data: QuickStockUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Quick update stock from inventory page (admin)"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if data.stock < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")
    
    product.stock = data.stock
    db.commit()
    return {"message": "Stock updated successfully", "product_id": product_id, "stock": product.stock}


class ReturnStatusUpdate(BaseModel):
    status: str  # "approved", "rejected", "completed"
    note: Optional[str] = None


@router.put("/orders/{order_id}/return-status")
async def update_order_return_status(
    order_id: int,
    data: ReturnStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin review customer return request (approve/reject/complete)"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.return_status = data.status
    if data.status == "approved":
        order.order_status = OrderStatus.returned
    elif data.status == "rejected":
        order.order_status = OrderStatus.delivered  # revert back to delivered

    history = OrderStatusHistory(
        order_id=order.id,
        status=order.order_status,
        note=f"Return request {data.status}. Admin note: {data.note or 'N/A'}",
        created_by=current_admin.email,
    )
    db.add(history)
    db.commit()
    return {"message": f"Return status updated to {data.status}", "return_status": data.status}


# ---- ACTIVITY LOGS ----
@router.get("/activity-log")
async def get_activity_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Get admin activity logs (admin)"""
    from app.models.admin_logs import AdminActivityLog
    query = db.query(AdminActivityLog).options(joinedload(AdminActivityLog.admin))
    total = query.count()
    logs = query.order_by(AdminActivityLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "admin_name": log.admin.name if log.admin else "System",
            "admin_email": log.admin.email if log.admin else "System",
            "action": log.action,
            "description": log.description,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat()
        })

    return {"items": result, "total": total, "page": page, "per_page": per_page}


# ---- REPORTS ----
@router.get("/reports/sales")
async def get_sales_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Get sales report summary with trend chart data"""
    query = db.query(Order).filter(Order.payment_status == PaymentStatus.paid)

    if start_date:
        query = query.filter(Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        end = datetime.fromisoformat(end_date) + timedelta(days=1)
        query = query.filter(Order.created_at < end)

    orders = query.options(joinedload(Order.items)).order_by(Order.created_at.asc()).all()

    total_sales = sum([o.total for o in orders])
    total_orders = len(orders)
    items_sold = sum([sum([i.quantity for i in o.items]) for o in orders])
    avg_order_value = total_sales / total_orders if total_orders > 0 else 0

    # Group revenue by period for Recharts
    grouped = {}
    for o in orders:
        if o.created_at:
            period = o.created_at.strftime("%b %d")
            grouped[period] = grouped.get(period, 0) + float(o.total)

    # If no orders or few, also provide the last 6 months breakdown
    monthly_revenue = []
    if grouped:
        monthly_revenue = [{"month": k, "revenue": round(v, 2)} for k, v in grouped.items()]
    else:
        for i in range(5, -1, -1):
            m_start = datetime.now().replace(day=1) - timedelta(days=30 * i)
            m_end = (m_start.replace(day=28) + timedelta(days=4)).replace(day=1)
            rev = db.query(func.sum(Order.total)).filter(
                Order.payment_status == PaymentStatus.paid,
                Order.created_at >= m_start,
                Order.created_at < m_end,
            ).scalar() or 0
            monthly_revenue.append({
                "month": m_start.strftime("%b %Y"),
                "revenue": float(rev),
            })

    return {
        "total_sales": float(total_sales),
        "total_orders": total_orders,
        "items_sold": items_sold,
        "average_order_value": float(avg_order_value),
        "monthly_revenue": monthly_revenue,
    }

