from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app.models.product import Product, ProductImage, ProductVariant
from app.models.category import Category
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, ProductImageOut, PaginatedProducts
from app.utils.helpers import generate_slug, calculate_final_price
from app.utils.storage import upload_image, delete_image_from_s3
from app.dependencies.auth import get_current_admin

router = APIRouter(prefix="/products", tags=["Products"])


def enrich_product(product: Product) -> ProductOut:
    out = ProductOut.model_validate(product)
    main_img = next((img for img in product.images if img.is_main), None)
    if not main_img and product.images:
        main_img = product.images[0]
    out.main_image = main_img.image_url if main_img else None
    out.category_name = product.category.name if product.category else None
    return out


@router.get("", response_model=PaginatedProducts)
async def get_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None,
    category_slug: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_discount: Optional[float] = None,
    in_stock: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    is_new_arrival: Optional[bool] = None,
    is_best_seller: Optional[bool] = None,
    sort_by: str = Query("newest"),
    status: bool = True,
    db: Session = Depends(get_db),
):
    query = (
        db.query(Product)
        .options(joinedload(Product.images), joinedload(Product.category))
        .filter(Product.status == status)
    )

    if category_id:
        query = query.filter(Product.category_id == category_id)
    if category_slug:
        cat = db.query(Category).filter(Category.slug == category_slug).first()
        if cat:
            query = query.filter(Product.category_id == cat.id)
    if min_price is not None:
        query = query.filter(Product.final_price >= min_price)
    if max_price is not None:
        query = query.filter(Product.final_price <= max_price)
    if min_discount is not None:
        query = query.filter(Product.discount_percent >= min_discount)
    if in_stock is not None:
        query = query.filter(Product.stock > 0) if in_stock else query.filter(Product.stock == 0)
    if is_featured is not None:
        query = query.filter(Product.is_featured == is_featured)
    if is_new_arrival is not None:
        query = query.filter(Product.is_new_arrival == is_new_arrival)
    if is_best_seller is not None:
        query = query.filter(Product.is_best_seller == is_best_seller)

    if sort_by == "price_asc":
        query = query.order_by(Product.final_price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.final_price.desc())
    elif sort_by == "discount":
        query = query.order_by(Product.discount_percent.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    products = query.offset((page - 1) * per_page).limit(per_page).all()

    return PaginatedProducts(
        items=[enrich_product(p) for p in products],
        total=total, page=page, per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/by-id/{product_id}", response_model=ProductOut)
async def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    product = (
        db.query(Product)
        .options(
            joinedload(Product.images),
            joinedload(Product.variants),
            joinedload(Product.category),
        )
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return enrich_product(product)


@router.get("/{slug}", response_model=ProductOut)
async def get_product(slug: str, db: Session = Depends(get_db)):
    product = (
        db.query(Product)
        .options(
            joinedload(Product.images),
            joinedload(Product.variants),
            joinedload(Product.category),
        )
        .filter(Product.slug == slug, Product.status == True)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return enrich_product(product)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate, db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    if data.sku:
        existing = db.query(Product).filter(Product.sku == data.sku).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"SKU '{data.sku}' already exists. Please use a different SKU."
            )

    slug = generate_slug(data.name)
    base_slug = slug
    counter = 1
    while db.query(Product).filter(Product.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    final_price = calculate_final_price(data.price, data.discount_percent)

    product = Product(
        name=data.name, slug=slug, sku=data.sku, category_id=data.category_id,
        description=data.description, specifications=data.specifications,
        price=data.price, discount_percent=data.discount_percent, final_price=final_price,
        stock=data.stock, low_stock_threshold=data.low_stock_threshold,
        weight=data.weight, unit=data.unit, status=data.status,
        is_featured=data.is_featured, is_new_arrival=data.is_new_arrival,
        is_best_seller=data.is_best_seller, meta_title=data.meta_title,
        meta_description=data.meta_description, tags=data.tags,
        moq=data.moq or 1, bulk_tiers=data.bulk_tiers,
    )
    db.add(product)
    db.flush()

    for variant_data in (data.variants or []):
        db.add(ProductVariant(product_id=product.id, **variant_data.model_dump()))

    db.commit()
    db.refresh(product)
    product = db.query(Product).options(
        joinedload(Product.images), joinedload(Product.variants), joinedload(Product.category),
    ).filter(Product.id == product.id).first()
    return enrich_product(product)


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if data.sku and data.sku != product.sku:
        existing = db.query(Product).filter(Product.sku == data.sku, Product.id != product_id).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"SKU '{data.sku}' already exists.")

    update_data = data.model_dump(exclude_unset=True)

    if "name" in update_data:
        slug = generate_slug(update_data["name"])
        base_slug = slug
        counter = 1
        while db.query(Product).filter(Product.slug == slug, Product.id != product_id).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        product.slug = slug

    if "price" in update_data or "discount_percent" in update_data:
        price = update_data.get("price", product.price)
        discount = update_data.get("discount_percent", product.discount_percent)
        product.final_price = calculate_final_price(price, discount)

    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    product = db.query(Product).options(
        joinedload(Product.images), joinedload(Product.variants), joinedload(Product.category),
    ).filter(Product.id == product.id).first()
    return enrich_product(product)


@router.post("/{product_id}/images", response_model=ProductImageOut, status_code=status.HTTP_201_CREATED)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    is_main: bool = Query(False),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    image_url = await upload_image(file, folder="products")

    if is_main:
        for img in product.images:
            img.is_main = False

    image = ProductImage(
        product_id=product.id,
        image_url=image_url,
        alt_text=product.name,
        is_main=is_main or len(product.images) == 0,
        sort_order=len(product.images),
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.delete("/{product_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_image(
    product_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    image = db.query(ProductImage).filter(
        ProductImage.id == image_id, ProductImage.product_id == product_id
    ).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    if image.image_url:
        delete_image_from_s3(image.image_url)

    db.delete(image)
    db.commit()


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    try:
        from app.models.cart import CartItem
        from app.models.wishlist import Wishlist
        from app.models.order import OrderItem

        # Remove from active carts and wishlists
        db.query(CartItem).filter(CartItem.product_id == product_id).delete(synchronize_session=False)
        db.query(Wishlist).filter(Wishlist.product_id == product_id).delete(synchronize_session=False)

        # Check if there are order items referencing this product
        has_orders = db.query(OrderItem).filter(OrderItem.product_id == product_id).first()
        if has_orders:
            product.status = False
            product.stock = 0
            db.commit()
            return {"message": "Product archived and hidden from catalog (preserved for order history)"}

        db.delete(product)
        db.commit()
        return {"message": "Product deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete product: {str(e)}")