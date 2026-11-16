from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime
import logging

from app.database import get_db
from app.models.contact import ContactInquiry
from app.dependencies.auth import get_current_admin
from app.models.user import User
from app.models.notification import Notification
from app.utils.email import send_contact_inquiry_emails

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["Contact"])


class ContactSubmit(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str
    inquiry_type: Optional[str] = "general"  # "general" or "bulk_rfq"
    company_name: Optional[str] = None
    target_qty: Optional[str] = None
    target_price: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_contact(
    data: ContactSubmit,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    inquiry = ContactInquiry(
        name=data.name,
        email=data.email,
        phone=data.phone,
        subject=data.subject,
        message=data.message,
        inquiry_type=data.inquiry_type or "general",
        company_name=data.company_name,
        target_qty=data.target_qty,
        target_price=data.target_price,
        status="pending",
    )
    db.add(inquiry)
    db.flush()
    
    # Create Admin Notification
    is_rfq = (data.inquiry_type == "bulk_rfq")
    notif = Notification(
        type="contact",
        title="New Bulk Order RFQ Inquiry" if is_rfq else "New Contact Message",
        message=f"Bulk RFQ from {inquiry.name} ({inquiry.company_name or 'N/A'}) - Target Qty: {inquiry.target_qty or 'N/A'}" if is_rfq else f"New inquiry from {inquiry.name} ({inquiry.email})",
        related_id=str(inquiry.id)
    )
    db.add(notif)
    db.commit()

    # Dispatch email notification in background
    try:
        background_tasks.add_task(send_contact_inquiry_emails, inquiry)
    except Exception as e:
        logger.error(f"Failed to queue contact inquiry email: {e}")

    msg = "Your bulk quotation request has been submitted. Our B2B sales team will contact you shortly." if is_rfq else "Your message has been sent. We will get back to you within 24 hours."
    return {"message": msg}


@router.get("/admin")
async def admin_list_inquiries(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
    page: int = 1,
    limit: int = 20,
    status_filter: Optional[str] = None,
    inquiry_type: Optional[str] = None,
):
    query = db.query(ContactInquiry)
    if status_filter:
        query = query.filter(ContactInquiry.status == status_filter)
    if inquiry_type:
        query = query.filter(ContactInquiry.inquiry_type == inquiry_type)

    total = query.count()
    items = query.order_by(ContactInquiry.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": [
            {
                "id": i.id,
                "name": i.name,
                "email": i.email,
                "phone": i.phone,
                "subject": i.subject,
                "message": i.message,
                "inquiry_type": getattr(i, "inquiry_type", "general"),
                "company_name": getattr(i, "company_name", None),
                "target_qty": getattr(i, "target_qty", None),
                "target_price": getattr(i, "target_price", None),
                "status": i.status,
                "is_resolved": (i.status == "resolved"),
                "admin_note": i.admin_note,
                "created_at": i.created_at.isoformat() if i.created_at else None,
            }
            for i in items
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


@router.put("/admin/{inquiry_id}/resolve")
async def admin_resolve_inquiry(
    inquiry_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    inquiry = db.query(ContactInquiry).filter(ContactInquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    inquiry.status = "resolved"
    db.commit()
    return {"message": "Inquiry marked as resolved"}


@router.put("/admin/{inquiry_id}/status")
async def admin_update_inquiry_status(
    inquiry_id: int,
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    inquiry = db.query(ContactInquiry).filter(ContactInquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    new_status = data.get("status", "resolved")
    inquiry.status = new_status
    if "admin_note" in data:
        inquiry.admin_note = data.get("admin_note")
    db.commit()
    return {"message": f"Inquiry status updated to {new_status}"}


@router.delete("/admin/{inquiry_id}")
async def admin_delete_inquiry(
    inquiry_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    inquiry = db.query(ContactInquiry).filter(ContactInquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    db.delete(inquiry)
    db.commit()
    return {"message": "Inquiry deleted successfully"}

