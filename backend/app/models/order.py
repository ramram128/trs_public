from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, 
    ForeignKey, Float, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    processing = "processing"
    packed = "packed"
    shipped = "shipped"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    cancelled = "cancelled"
    returned = "returned"
    return_requested = "return_requested"


class PaymentMethod(str, enum.Enum):
    cod = "cod"
    online = "online"
    bank_transfer = "bank_transfer"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Shipping address (snapshot at order time)
    customer_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    country = Column(String(100), default="Sri Lanka")

    # Financials
    subtotal = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0)
    coupon_code = Column(String(50), nullable=True, default=None)
    delivery_charge = Column(Float, default=0)
    total = Column(Float, nullable=False)

    # Payment
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    bank_slip_url = Column(String(1000), nullable=True, default=None)

    # Order status
    order_status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    notes = Column(Text, nullable=True)
    return_reason = Column(Text, nullable=True, default=None)
    return_status = Column(String(50), nullable=True, default=None)  # requested, approved, rejected, completed

    # Tracking
    tracking_id = Column(String(100), nullable=True, default=None)
    courier_name = Column(String(100), nullable=True, default=None)
    tracking_url = Column(String(500), nullable=True, default=None)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String(500), nullable=False)  # snapshot
    product_sku = Column(String(100), nullable=True)
    product_image = Column(String(1000), nullable=True)
    variant_info = Column(String(200), nullable=True)  # "Size: 1kg, Color: Red"
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    total = Column(Float, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"))
    status = Column(Enum(OrderStatus), nullable=False)
    note = Column(Text, nullable=True)
    created_by = Column(String(100), nullable=True)  # admin email or "system"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="status_history")
