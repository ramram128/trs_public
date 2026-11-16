from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text
)
from sqlalchemy.sql import func
from app.database import Base


class HomepageBanner(Base):
    __tablename__ = "homepage_banners"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    subtitle = Column(Text, nullable=True)
    image_url = Column(String(1000), nullable=True)
    link_url = Column(String(1000), nullable=True)
    button_text = Column(String(100), default="Shop Now")
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    position = Column(String(50), default="hero")  # hero, promo, sidebar
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
