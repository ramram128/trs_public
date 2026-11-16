from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


class CheckoutAddress(BaseModel):
    customer_name: str
    email: EmailStr
    phone: str
    address: str
    city: str
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: str = "Sri Lanka"

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v):
        if len(v) < 9:
            raise ValueError("Invalid phone number")
        return v


class CheckoutRequest(BaseModel):
    address_id: Optional[int] = None
    address: Optional[CheckoutAddress] = None
    payment_method: str  # "cod", "online", "bank_transfer"
    coupon_code: Optional[str] = None
    bank_slip_url: Optional[str] = None
    notes: Optional[str] = None


class OrderReturnRequest(BaseModel):
    reason: str


class OrderReturnStatusUpdate(BaseModel):
    status: str  # "approved", "rejected", "completed"
    note: Optional[str] = None


class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    product_sku: Optional[str] = None
    product_image: Optional[str] = None
    variant_info: Optional[str] = None
    unit_price: float
    quantity: int
    total: float

    model_config = {"from_attributes": True}


class OrderStatusHistoryOut(BaseModel):
    id: int
    status: str
    note: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True, "use_enum_values": True}


class OrderOut(BaseModel):
    id: int
    order_number: str
    customer_name: str
    email: str
    phone: str
    address: str
    city: str
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: str
    subtotal: float
    discount_amount: float
    coupon_code: Optional[str] = None
    delivery_charge: float
    total: float
    payment_method: str
    payment_status: str
    bank_slip_url: Optional[str] = None
    order_status: str
    notes: Optional[str] = None
    return_reason: Optional[str] = None
    return_status: Optional[str] = None
    tracking_id: Optional[str] = None
    courier_name: Optional[str] = None
    tracking_url: Optional[str] = None
    items: List[OrderItemOut] = []
    status_history: List[OrderStatusHistoryOut] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True, "use_enum_values": True}


class OrderListOut(BaseModel):
    id: int
    order_number: str
    customer_name: str
    total: float
    payment_method: str
    payment_status: str
    order_status: str
    tracking_id: Optional[str] = None
    courier_name: Optional[str] = None
    item_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True, "use_enum_values": True}


class OrderStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None


class PaymentStatusUpdate(BaseModel):
    status: str


class OrderTrackingUpdate(BaseModel):
    tracking_id: Optional[str] = None
    courier_name: Optional[str] = None
    tracking_url: Optional[str] = None
    order_status: Optional[str] = None
    notify_customer: Optional[bool] = True


class OrderTrackingResponse(BaseModel):
    order_number: str
    customer_name: str
    order_status: str
    payment_status: str
    tracking_id: Optional[str] = None
    courier_name: Optional[str] = None
    tracking_url: Optional[str] = None
    created_at: datetime
    status_history: List[OrderStatusHistoryOut]
    items: List[OrderItemOut]
    total: float

    model_config = {"use_enum_values": True}
