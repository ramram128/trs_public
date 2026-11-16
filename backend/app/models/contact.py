from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text
)
from sqlalchemy.sql import func
import enum
from app.database import Base


class ContactStatus(str, enum.Enum):
    pending = "pending"
    read = "read"
    replied = "replied"
    resolved = "resolved"


class ContactInquiry(Base):
    __tablename__ = "contact_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    subject = Column(String(255), nullable=True)
    message = Column(Text, nullable=False)
    inquiry_type = Column(String(50), default="general")  # "general" or "bulk_rfq"
    company_name = Column(String(255), nullable=True)
    target_qty = Column(String(100), nullable=True)
    target_price = Column(String(100), nullable=True)
    status = Column(String(20), default="pending")
    admin_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
