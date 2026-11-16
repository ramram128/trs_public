from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, 
    ForeignKey, Float, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), nullable=False, index=True)
    slug = Column(String(500), unique=True, index=True, nullable=False)
    sku = Column(String(100), unique=True, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    description = Column(Text, nullable=True)
    specifications = Column(JSON, nullable=True)  # dict of spec key-value pairs
    price = Column(Float, nullable=False)
    discount_percent = Column(Float, default=0)
    final_price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=5)
    weight = Column(Float, nullable=True)  # in grams
    unit = Column(String(50), nullable=True)  # kg, g, L, ml, piece
    status = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_new_arrival = Column(Boolean, default=False)
    is_best_seller = Column(Boolean, default=False)
    meta_title = Column(String(500), nullable=True)
    meta_description = Column(Text, nullable=True)
    tags = Column(String(1000), nullable=True)  # comma-separated tags
    moq = Column(Integer, default=1)  # Minimum Order Quantity
    bulk_tiers = Column(JSON, nullable=True)  # list of {"min_qty": 10, "discount_percent": 15, "unit_price": 850}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    wishlist = relationship("Wishlist", back_populates="product")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    image_url = Column(String(1000), nullable=False)
    alt_text = Column(String(500), nullable=True)
    is_main = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product", back_populates="images")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    variant_type = Column(String(50), nullable=False)   # size, color, weight
    variant_value = Column(String(100), nullable=False)  # 1kg, Red, XL
    price_adjustment = Column(Float, default=0)
    stock = Column(Integer, default=0)
    sku_suffix = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    product = relationship("Product", back_populates="variants")
    cart_items = relationship("CartItem", back_populates="variant")
