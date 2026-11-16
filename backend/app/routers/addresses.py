from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from app.database import get_db
from app.models.address import Address
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/addresses", tags=["Addresses"])


class AddressCreate(BaseModel):
    label: str = "Home"
    customer_name: str
    phone: Optional[str] = None
    address: str
    city: str
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: str = "Sri Lanka"
    is_default: bool = False


class AddressUpdate(BaseModel):
    label: Optional[str] = None
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None


class AddressOut(BaseModel):
    id: int
    label: str
    customer_name: str
    phone: Optional[str] = None
    address: str
    city: str
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: str
    is_default: bool

    model_config = {"from_attributes": True}


@router.get("", response_model=List[AddressOut])
async def list_addresses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    addresses = db.query(Address).filter(
        Address.user_id == current_user.id
    ).order_by(Address.is_default.desc(), Address.created_at.desc()).all()
    return [AddressOut.model_validate(a) for a in addresses]


@router.post("", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
async def create_address(
    data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.is_default:
        db.query(Address).filter(
            Address.user_id == current_user.id
        ).update({"is_default": False})

    address = Address(user_id=current_user.id, **data.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return AddressOut.model_validate(address)


@router.put("/{address_id}", response_model=AddressOut)
async def update_address(
    address_id: int,
    data: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id,
    ).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    update_data = data.model_dump(exclude_unset=True)

    if update_data.get("is_default"):
        db.query(Address).filter(
            Address.user_id == current_user.id
        ).update({"is_default": False})

    for field, value in update_data.items():
        setattr(address, field, value)

    db.commit()
    db.refresh(address)
    return AddressOut.model_validate(address)


@router.delete("/{address_id}")
async def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id,
    ).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    db.delete(address)
    db.commit()
    return {"message": "Address deleted successfully"}


@router.put("/{address_id}/default")
async def set_default_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id,
    ).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    db.query(Address).filter(
        Address.user_id == current_user.id
    ).update({"is_default": False})

    address.is_default = True
    db.commit()
    return {"message": "Default address set"}
