from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.models.newsletter import NewsletterSubscriber
from app.dependencies.auth import get_current_admin
from app.models.user import User
from typing import List

router = APIRouter(prefix="/newsletter", tags=["Newsletter"])


class NewsletterSubscribe(BaseModel):
    email: EmailStr


class NewsletterUnsubscribe(BaseModel):
    email: EmailStr


@router.post("/subscribe")
async def subscribe(data: NewsletterSubscribe, response: Response, db: Session = Depends(get_db)):
    existing = db.query(NewsletterSubscriber).filter(
        NewsletterSubscriber.email == data.email
    ).first()

    if existing:
        if existing.is_active:
            response.status_code = status.HTTP_200_OK
            return {"message": "You are already subscribed!"}
        existing.is_active = True
        db.commit()
        response.status_code = status.HTTP_200_OK
        return {"message": "Welcome back! You have been resubscribed."}

    subscriber = NewsletterSubscriber(email=data.email, is_active=True)
    db.add(subscriber)
    db.commit()
    response.status_code = status.HTTP_201_CREATED
    return {"message": "Thank you for subscribing!"}


@router.delete("/unsubscribe")
async def unsubscribe(data: NewsletterUnsubscribe, db: Session = Depends(get_db)):
    subscriber = db.query(NewsletterSubscriber).filter(
        NewsletterSubscriber.email == data.email
    ).first()
    if not subscriber:
        raise HTTPException(status_code=404, detail="Email not found in subscribers")
    subscriber.is_active = False
    db.commit()
    return {"message": "You have been unsubscribed."}


@router.get("/admin")
async def admin_list_subscribers(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
    page: int = 1,
    limit: int = 20,
):
    total = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.is_active == True).count()
    subscribers = (
        db.query(NewsletterSubscriber)
        .filter(NewsletterSubscriber.is_active == True)
        .order_by(NewsletterSubscriber.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "items": [
            {"id": s.id, "email": s.email, "created_at": s.created_at.isoformat() if s.created_at else None}
            for s in subscribers
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }
