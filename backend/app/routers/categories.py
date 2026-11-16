from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut
from app.utils.helpers import generate_slug
from app.utils.storage import upload_image
from app.dependencies.auth import get_current_admin

router = APIRouter(prefix="/categories", tags=["Categories"])


def get_category_out(cat: Category, db: Session) -> CategoryOut:
    product_count = db.query(func.count(Product.id)).filter(
        Product.category_id == cat.id, Product.status == True
    ).scalar()
    out = CategoryOut.model_validate(cat)
    out.product_count = product_count
    return out


@router.get("", response_model=List[CategoryOut])
async def get_categories(status: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(Category)
    if status is not None:
        query = query.filter(Category.status == status)
    categories = query.order_by(Category.sort_order, Category.name).all()
    return [get_category_out(cat, db) for cat in categories]


@router.get("/by-id/{cat_id}", response_model=CategoryOut)
async def get_category_by_id(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return get_category_out(cat, db)


@router.get("/{slug}", response_model=CategoryOut)
async def get_category(slug: str, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.slug == slug).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return get_category_out(cat, db)


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    slug = data.slug or generate_slug(data.name)
    base_slug = slug
    counter = 1
    while db.query(Category).filter(Category.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    cat = Category(
        name=data.name, slug=slug, description=data.description,
        image=data.image, status=data.status, sort_order=data.sort_order,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return get_category_out(cat, db)


@router.put("/{cat_id}", response_model=CategoryOut)
async def update_category(
    cat_id: int, data: CategoryUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = data.model_dump(exclude_none=True)
    if "name" in update_data and "slug" not in update_data:
        update_data["slug"] = generate_slug(update_data["name"])

    for field, value in update_data.items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return get_category_out(cat, db)


@router.delete("/{cat_id}")
async def delete_category(
    cat_id: int, db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    product_count = db.query(func.count(Product.id)).filter(Product.category_id == cat_id).scalar()
    if product_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete. {product_count} products assigned.")

    db.delete(cat)
    db.commit()
    return {"message": "Category deleted successfully"}


@router.post("/{cat_id}/upload-image", response_model=CategoryOut)
async def upload_category_image(
    cat_id: int, file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    image_url = await upload_image(file, folder="categories")
    cat.image = image_url
    db.commit()
    db.refresh(cat)
    return get_category_out(cat, db)
