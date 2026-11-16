from pydantic import BaseModel, field_validator
from typing import Optional, List, Any, Dict
from datetime import datetime


class ProductImageOut(BaseModel):
    id: int
    image_url: str
    alt_text: Optional[str] = None
    is_main: bool
    sort_order: int

    model_config = {"from_attributes": True}


class ProductVariantOut(BaseModel):
    id: int
    variant_type: str
    variant_value: str
    price_adjustment: float
    stock: int
    is_active: bool

    model_config = {"from_attributes": True}


class ProductVariantCreate(BaseModel):
    variant_type: str
    variant_value: str
    price_adjustment: float = 0
    stock: int = 0
    sku_suffix: Optional[str] = None


class ProductCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    price: float
    discount_percent: float = 0
    stock: int = 0
    low_stock_threshold: int = 5
    weight: Optional[float] = None
    unit: Optional[str] = None
    status: bool = True
    is_featured: bool = False
    is_new_arrival: bool = False
    is_best_seller: bool = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[str] = None
    moq: Optional[int] = 1
    bulk_tiers: Optional[List[Dict[str, Any]]] = None
    variants: Optional[List[ProductVariantCreate]] = []

    @field_validator("price")
    @classmethod
    def price_positive(cls, v):
        if v <= 0:
            raise ValueError("Price must be positive")
        return v

    @field_validator("discount_percent")
    @classmethod
    def discount_valid(cls, v):
        if v < 0 or v > 100:
            raise ValueError("Discount must be between 0 and 100")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    price: Optional[float] = None
    discount_percent: Optional[float] = None
    stock: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    weight: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    is_best_seller: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[str] = None
    moq: Optional[int] = None
    bulk_tiers: Optional[List[Dict[str, Any]]] = None


class ProductOut(BaseModel):
    id: int
    name: str
    slug: str
    sku: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    description: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    price: float
    discount_percent: float
    final_price: float
    stock: int
    low_stock_threshold: int
    weight: Optional[float] = None
    unit: Optional[str] = None
    status: bool
    is_featured: bool
    is_new_arrival: bool
    is_best_seller: bool
    tags: Optional[str] = None
    moq: Optional[int] = 1
    bulk_tiers: Optional[List[Dict[str, Any]]] = None
    images: List[ProductImageOut] = []
    variants: List[ProductVariantOut] = []
    main_image: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PaginatedProducts(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    per_page: int
    total_pages: int
