from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from app.database import get_db
from app.models.banner import HomepageBanner
from app.dependencies.auth import get_current_admin
from app.models.user import User

router = APIRouter(prefix="/banners", tags=["Banners"])


class BannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    button_text: str = "Shop Now"
    sort_order: int = 0
    is_active: bool = True
    position: str = "hero"


class BannerUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    button_text: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    position: Optional[str] = None


class BannerOut(BaseModel):
    id: int
    title: str
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    button_text: str
    sort_order: int
    is_active: bool
    position: str

    model_config = {"from_attributes": True}


@router.get("", response_model=List[BannerOut])
async def list_banners(
    db: Session = Depends(get_db),
    position: Optional[str] = None,
):
    query = db.query(HomepageBanner).filter(HomepageBanner.is_active == True)
    if position:
        query = query.filter(HomepageBanner.position == position)
    banners = query.order_by(HomepageBanner.sort_order, HomepageBanner.id).all()
    return [BannerOut.model_validate(b) for b in banners]


@router.get("/admin", response_model=List[BannerOut])
async def admin_list_banners(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    banners = db.query(HomepageBanner).order_by(HomepageBanner.position, HomepageBanner.sort_order).all()
    return [BannerOut.model_validate(b) for b in banners]


@router.post("/admin", response_model=BannerOut, status_code=status.HTTP_201_CREATED)
async def create_banner(
    data: BannerCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    banner = HomepageBanner(**data.model_dump())
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return BannerOut.model_validate(banner)


@router.put("/admin/{banner_id}", response_model=BannerOut)
async def update_banner(
    banner_id: int,
    data: BannerUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    banner = db.query(HomepageBanner).filter(HomepageBanner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(banner, field, value)

    db.commit()
    db.refresh(banner)
    return BannerOut.model_validate(banner)


@router.delete("/admin/{banner_id}")
async def delete_banner(
    banner_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    banner = db.query(HomepageBanner).filter(HomepageBanner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    db.delete(banner)
    db.commit()
    return {"message": "Banner deleted successfully"}
