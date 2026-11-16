from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False) # e.g., 'order', 'contact', 'system', 'user'
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    related_id = Column(String(100), nullable=True) # e.g., order_number, user_id, inquiry_id
    created_at = Column(DateTime(timezone=True), server_default=func.now())
