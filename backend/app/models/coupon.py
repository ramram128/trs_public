from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, Float
)
from sqlalchemy.sql import func
import enum
from app.database import Base


class CouponType(str, enum.Enum):
    percentage = "percentage"
    fixed = "fixed"


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    coupon_type = Column(String(20), nullable=False, default="percentage")  # percentage or fixed
    discount_value = Column(Float, nullable=False)  # percentage (0-100) or fixed amount
    min_order_amount = Column(Float, default=0)
    max_uses = Column(Integer, nullable=True)  # null = unlimited
    used_count = Column(Integer, default=0)
    max_uses_per_user = Column(Integer, default=1)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
