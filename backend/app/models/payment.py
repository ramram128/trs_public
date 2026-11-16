from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class PaymentGateway(str, enum.Enum):
    payhere = "payhere"
    cod = "cod"
    bank_transfer = "bank_transfer"


class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True)
    transaction_id = Column(String(255), nullable=True, index=True)  # from payment gateway
    gateway = Column(Enum(PaymentGateway), nullable=False)
    payment_type = Column(String(20), nullable=True)  # card, bank, wallet (for online payments)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="LKR")
    status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.pending)
    gateway_response = Column(JSON, nullable=True)  # raw response from gateway
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    order = relationship("Order", back_populates="payment")
