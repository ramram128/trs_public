from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.dependencies.auth import get_current_admin

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    query = db.query(Notification)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications

@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    count = db.query(Notification).filter(Notification.is_read == False).count()
    return {"unread_count": count}

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
