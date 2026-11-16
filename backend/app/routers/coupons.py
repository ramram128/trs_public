from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.coupon import Coupon
from app.dependencies.auth import get_current_user, get_current_admin
from app.models.user import User

router = APIRouter(prefix="/coupons", tags=["Coupons"])


class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    coupon_type: str = "percentage"
    discount_value: float
    min_order_amount: float = 0
    max_uses: Optional[int] = None
    max_uses_per_user: int = 1
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True


class CouponUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    coupon_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_uses: Optional[int] = None
    max_uses_per_user: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class CouponOut(BaseModel):
    id: int
    code: str
    description: Optional[str] = None
    coupon_type: str
    discount_value: float
    min_order_amount: float
    max_uses: Optional[int] = None
    used_count: int
    max_uses_per_user: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool

    model_config = {"from_attributes": True}


class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float


# --- Public endpoints ---

@router.get("/active", response_model=List[CouponOut])
async def list_active_coupons(db: Session = Depends(get_db)):
    """List all active coupons (public, no auth needed)"""
    coupons = db.query(Coupon).filter(Coupon.is_active == True).order_by(Coupon.created_at.desc()).all()
    return [CouponOut.model_validate(c) for c in coupons]


@router.post("/validate")
async def validate_coupon(data: CouponValidateRequest, db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter(
        Coupon.code == data.code.upper(),
        Coupon.is_active == True,
    ).first()

    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")

    now = datetime.utcnow()
    if coupon.start_date and now < coupon.start_date:
        raise HTTPException(status_code=400, detail="Coupon is not yet active")
    if coupon.end_date and now > coupon.end_date:
        raise HTTPException(status_code=400, detail="Coupon has expired")
    if coupon.max_uses and coupon.used_count >= coupon.max_uses:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    if data.subtotal < coupon.min_order_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order amount is Rs. {coupon.min_order_amount:.2f}"
        )

    if coupon.coupon_type == "percentage":
        discount = round(data.subtotal * coupon.discount_value / 100, 2)
    else:
        discount = min(coupon.discount_value, data.subtotal)

    return {
        "code": coupon.code,
        "coupon_type": coupon.coupon_type,
        "discount_value": coupon.discount_value,
        "discount_amount": discount,
        "message": f"Coupon applied! You save Rs. {discount:.2f}",
    }


# --- Admin endpoints ---

@router.get("", response_model=List[CouponOut])
async def list_coupons(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    coupons = db.query(Coupon).order_by(Coupon.created_at.desc()).all()
    return [CouponOut.model_validate(c) for c in coupons]


@router.post("", response_model=CouponOut, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    data: CouponCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    existing = db.query(Coupon).filter(Coupon.code == data.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    coupon = Coupon(**data.model_dump())
    coupon.code = coupon.code.upper()
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return CouponOut.model_validate(coupon)


@router.put("/{coupon_id}", response_model=CouponOut)
async def update_coupon(
    coupon_id: int,
    data: CouponUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    update_data = data.model_dump(exclude_unset=True)
    if "code" in update_data:
        update_data["code"] = update_data["code"].upper()
        existing = db.query(Coupon).filter(
            Coupon.code == update_data["code"],
            Coupon.id != coupon_id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Coupon code already exists")

    for field, value in update_data.items():
        setattr(coupon, field, value)

    db.commit()
    db.refresh(coupon)
    return CouponOut.model_validate(coupon)


@router.delete("/{coupon_id}")
async def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    db.delete(coupon)
    db.commit()
    return {"message": "Coupon deleted successfully"}
