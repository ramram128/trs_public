from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database import get_db
from app.models.settings import Setting
from app.dependencies.auth import get_current_admin

router = APIRouter(prefix="/settings", tags=["Settings"])

DEFAULT_SETTINGS = [
    # Delivery
    {"key": "delivery_enabled", "value": "true", "group": "delivery", "description": "Enable delivery charge"},
    {"key": "delivery_charge", "value": "350", "group": "delivery", "description": "Flat delivery charge in LKR"},
    {"key": "free_delivery_above", "value": "5000", "group": "delivery", "description": "Free delivery above this amount"},

    # Contact
    {"key": "whatsapp_number", "value": "94742975043", "group": "contact", "description": "WhatsApp contact number"},
    {"key": "support_email", "value": "support@trsimports.com", "group": "contact", "description": "Support email"},
    {"key": "support_phone", "value": "+94 742 975 043", "group": "contact", "description": "Phone number"},

    # Social Media
    {"key": "instagram_url", "value": "", "group": "social", "description": "Instagram page URL"},
    {"key": "facebook_url", "value": "", "group": "social", "description": "Facebook page URL"},
    {"key": "youtube_url", "value": "", "group": "social", "description": "YouTube channel URL"},
    {"key": "twitter_url", "value": "", "group": "social", "description": "Twitter/X profile URL"},
    {"key": "linkedin_url", "value": "", "group": "social", "description": "LinkedIn page URL"},

    # Store
    {"key": "store_name", "value": "TRS Products", "group": "store", "description": "Store name"},
    {"key": "store_tagline", "value": "Quality · Trust · Goodness", "group": "store", "description": "Store tagline"},
    {"key": "store_address", "value": "Sri Lanka", "group": "store", "description": "Store address"},
    {"key": "currency", "value": "LKR", "group": "store", "description": "Currency code"},
    {"key": "currency_symbol", "value": "Rs.", "group": "store", "description": "Currency symbol"},
]


@router.get("")
async def get_settings(group: str = None, db: Session = Depends(get_db)):
    """Get all settings (public — hides sensitive keys)"""
    query = db.query(Setting)
    if group:
        query = query.filter(Setting.group == group)
    settings = query.all()

    if not settings:
        # Seed defaults
        await initialize_default_settings(db)
        query = db.query(Setting)
        if group:
            query = query.filter(Setting.group == group)
        settings = query.all()

    return {s.key: s.value for s in settings}


@router.put("")
async def update_settings(
    updates: Dict[str, Any],
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Update multiple settings at once (admin only)"""
    for key, value in updates.items():
        setting = db.query(Setting).filter(Setting.key == key).first()
        if setting:
            setting.value = str(value)
        else:
            db.add(Setting(key=key, value=str(value), group="general"))

    db.commit()
    return {"message": "Settings updated successfully"}


async def initialize_default_settings(db: Session):
    """Seed default settings if not present"""
    for s in DEFAULT_SETTINGS:
        existing = db.query(Setting).filter(Setting.key == s["key"]).first()
        if not existing:
            db.add(Setting(**s))
    db.commit()
