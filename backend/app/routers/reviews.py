from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.review import Review
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.dependencies.auth import get_current_user, get_current_admin
from app.models.user import User

router = APIRouter(prefix="/reviews", tags=["Reviews"])


class ReviewCreate(BaseModel):
    product_id: int
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    title: Optional[str] = None
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    product_id: int
    user_id: int
    user_name: Optional[str] = None
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    is_approved: bool
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/product/{product_id}", response_model=List[ReviewOut])
async def get_product_reviews(
    product_id: int,
    db: Session = Depends(get_db),
):
    reviews = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.product_id == product_id, Review.is_approved == True)
        .order_by(Review.created_at.desc())
        .all()
    )
    result = []
    for r in reviews:
        out = ReviewOut.model_validate(r)
        out.user_name = r.user.name if r.user else "Anonymous"
        result.append(out)
    return result


@router.get("/product/{product_id}/summary")
async def get_review_summary(product_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import func
    result = db.query(
        func.avg(Review.rating).label("avg_rating"),
        func.count(Review.id).label("total_reviews"),
    ).filter(
        Review.product_id == product_id,
        Review.is_approved == True,
    ).first()

    avg = round(float(result.avg_rating), 1) if result.avg_rating else 0
    total = result.total_reviews or 0

    # Rating distribution
    distribution = {}
    for i in range(1, 6):
        count = db.query(Review).filter(
            Review.product_id == product_id,
            Review.is_approved == True,
            Review.rating == i,
        ).count()
        distribution[str(i)] = count

    return {
        "average_rating": avg,
        "total_reviews": total,
        "distribution": distribution,
    }


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not 1 <= data.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if user purchased this product
    has_purchased = (
        db.query(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(
            Order.user_id == current_user.id,
            OrderItem.product_id == data.product_id,
            Order.order_status == OrderStatus.delivered,
        )
        .first()
    )

    # Check for existing review
    existing = db.query(Review).filter(
        Review.product_id == data.product_id,
        Review.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")

    review = Review(
        product_id=data.product_id,
        user_id=current_user.id,
        rating=data.rating,
        title=data.title,
        comment=data.comment,
        is_approved=True,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    out = ReviewOut.model_validate(review)
    out.user_name = current_user.name
    return out


@router.put("/{review_id}", response_model=ReviewOut)
async def update_review(
    review_id: int,
    data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    if data.rating is not None:
        if not 1 <= data.rating <= 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        review.rating = data.rating
    if data.title is not None:
        review.title = data.title
    if data.comment is not None:
        review.comment = data.comment

    db.commit()
    db.refresh(review)

    out = ReviewOut.model_validate(review)
    out.user_name = current_user.name
    return out


@router.delete("/{review_id}")
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(review)
    db.commit()
    return {"message": "Review deleted successfully"}


# --- Admin endpoints ---

@router.get("/admin/all")
async def admin_list_reviews(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
    page: int = 1,
    limit: int = 20,
    status_filter: Optional[str] = None,
):
    query = db.query(Review).options(joinedload(Review.user), joinedload(Review.product))
    if status_filter == "approved":
        query = query.filter(Review.is_approved == True)
    elif status_filter == "pending":
        query = query.filter(Review.is_approved == False)

    total = query.count()
    reviews = query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for r in reviews:
        items.append({
            "id": r.id,
            "product_id": r.product_id,
            "product_name": r.product.name if r.product else None,
            "user_id": r.user_id,
            "user_name": r.user.name if r.user else "Anonymous",
            "rating": r.rating,
            "title": r.title,
            "comment": r.comment,
            "is_approved": r.is_approved,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return {"items": items, "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.put("/admin/{review_id}/approve")
async def admin_approve_review(
    review_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.is_approved = not review.is_approved
    db.commit()
    return {"message": "Review approved" if review.is_approved else "Review hidden", "is_approved": review.is_approved}


@router.delete("/admin/{review_id}")
async def admin_delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    db.delete(review)
    db.commit()
    return {"message": "Review deleted successfully"}
