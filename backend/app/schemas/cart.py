from pydantic import BaseModel, Field
from typing import Optional, List


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, gt=0)
    variant_id: Optional[int] = None


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_slug: str
    product_image: Optional[str]
    variant_id: Optional[int]
    variant_info: Optional[str]
    quantity: int
    unit_price: float
    final_price: float
    subtotal: float
    stock: int

    class Config:
        from_attributes = True


class CartOut(BaseModel):
    id: int
    items: List[CartItemOut]
    subtotal: float
    item_count: int

    class Config:
        from_attributes = True


class WishlistItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_slug: str
    product_image: Optional[str]
    price: float
    final_price: float
    stock: int

    class Config:
        from_attributes = True
