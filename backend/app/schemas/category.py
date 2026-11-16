from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    status: bool = True
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    status: Optional[bool] = None
    sort_order: Optional[int] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    image: Optional[str]
    status: bool
    sort_order: int
    product_count: Optional[int] = 0
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
