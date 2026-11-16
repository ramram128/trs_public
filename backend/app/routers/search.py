from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import List, Optional

from app.database import get_db
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductOut
from app.routers.products import enrich_product

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=dict)
async def search_products(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Full-text search across product name, description, SKU, and tags"""
    search_term = f"%{q}%"

    query = (
        db.query(Product)
        .options(joinedload(Product.images), joinedload(Product.category))
        .filter(
            Product.status == True,
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.sku.ilike(search_term),
                Product.tags.ilike(search_term),
                Product.category.has(Category.name.ilike(search_term)),
            ),
        )
        .order_by(Product.is_featured.desc(), Product.created_at.desc())
    )

    total = query.count()
    products = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "query": q,
        "items": [enrich_product(p).model_dump() for p in products],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Get rich search suggestions including images, prices, categories, and stock status"""
    search_term = f"%{q.strip()}%"
    products = (
        db.query(Product)
        .options(joinedload(Product.images), joinedload(Product.category))
        .filter(
            Product.status == True,
            or_(
                Product.name.ilike(search_term),
                Product.sku.ilike(search_term),
                Product.tags.ilike(search_term),
                Product.category.has(Category.name.ilike(search_term)),
            ),
        )
        .order_by(Product.is_featured.desc(), Product.is_best_seller.desc())
        .limit(limit)
        .all()
    )

    result = []
    for p in products:
        main_img = next((img.image_url for img in p.images if img.is_main), None)
        if not main_img and p.images:
            main_img = p.images[0].image_url
        result.append({
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "price": p.final_price,
            "original_price": p.price,
            "discount_percent": p.discount_percent,
            "image": main_img,
            "category_name": p.category.name if p.category else None,
            "unit": p.unit,
            "stock": p.stock,
        })
    return result
