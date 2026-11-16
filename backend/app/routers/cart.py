from fastapi import APIRouter, Depends, HTTPException, status, Cookie, Response
from sqlalchemy.orm import Session, joinedload
from typing import Optional
import uuid

from app.database import get_db
from app.models.cart import Cart, CartItem, Wishlist
from app.models.product import Product, ProductVariant
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartOut, CartItemOut, WishlistItemOut
from app.dependencies.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/cart", tags=["Cart"])


def get_or_create_cart(
    db: Session,
    user: Optional[User] = None,
    session_id: Optional[str] = None,
) -> Cart:
    """Get existing cart or create new one"""
    if user:
        cart = db.query(Cart).filter(Cart.user_id == user.id).first()
        if not cart:
            cart = Cart(user_id=user.id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
    else:
        if not session_id:
            session_id = str(uuid.uuid4())
        cart = db.query(Cart).filter(Cart.session_id == session_id).first()
        if not cart:
            cart = Cart(session_id=session_id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
    return cart


def build_cart_out(cart: Cart, db: Session) -> CartOut:
    """Build CartOut response"""
    items = []
    subtotal = 0.0

    for item in cart.items:
        product = item.product
        if not product or not product.status:
            continue

        variant_info = None
        if item.variant_id and item.variant:
            v = item.variant
            variant_info = f"{v.variant_type}: {v.variant_value}"

        final_price = product.final_price
        item_subtotal = final_price * item.quantity
        subtotal += item_subtotal

        main_img = next((img for img in product.images if img.is_main), None)
        if not main_img and product.images:
            main_img = product.images[0]

        items.append(CartItemOut(
            id=item.id,
            product_id=product.id,
            product_name=product.name,
            product_slug=product.slug,
            product_image=main_img.image_url if main_img else None,
            variant_id=item.variant_id,
            variant_info=variant_info,
            quantity=item.quantity,
            unit_price=product.price,
            final_price=final_price,
            subtotal=item_subtotal,
            stock=product.stock,
        ))

    return CartOut(
        id=cart.id,
        items=items,
        subtotal=round(subtotal, 2),
        item_count=sum(i.quantity for i in items),
    )


@router.get("", response_model=CartOut)
async def get_cart(
    session_id: Optional[str] = Cookie(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Get current cart"""
    cart = get_or_create_cart(db, current_user, session_id)
    cart = db.query(Cart).options(
        joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.images),
        joinedload(Cart.items).joinedload(CartItem.variant),
    ).filter(Cart.id == cart.id).first()
    return build_cart_out(cart, db)


@router.post("/items", response_model=CartOut)
async def add_to_cart(
    data: CartItemCreate,
    response: Response,
    session_id: Optional[str] = Cookie(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Add item to cart"""
    # Validate product
    product = db.query(Product).filter(
        Product.id == data.product_id, Product.status == True
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock < data.quantity:
        raise HTTPException(status_code=400, detail=f"Only {product.stock} items in stock")

    cart = get_or_create_cart(db, current_user, session_id)

    # Set session cookie for guests
    if not current_user and cart.session_id:
        response.set_cookie("session_id", cart.session_id, max_age=7 * 24 * 3600)

    # Check if item already exists
    existing = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == data.product_id,
        CartItem.variant_id == data.variant_id,
    ).first()

    if existing:
        new_qty = existing.quantity + data.quantity
        if new_qty > product.stock:
            raise HTTPException(status_code=400, detail=f"Only {product.stock} items in stock")
        existing.quantity = new_qty
    else:
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=data.product_id,
            variant_id=data.variant_id,
            quantity=data.quantity,
            unit_price=product.final_price,
        )
        db.add(cart_item)

    db.commit()

    cart = db.query(Cart).options(
        joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.images),
        joinedload(Cart.items).joinedload(CartItem.variant),
    ).filter(Cart.id == cart.id).first()
    return build_cart_out(cart, db)


@router.put("/items/{item_id}", response_model=CartOut)
async def update_cart_item(
    item_id: int,
    data: CartItemUpdate,
    session_id: Optional[str] = Cookie(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Update cart item quantity"""
    cart = get_or_create_cart(db, current_user, session_id)
    item = db.query(CartItem).filter(
        CartItem.id == item_id, CartItem.cart_id == cart.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if data.quantity <= 0:
        db.delete(item)
    else:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product and data.quantity > product.stock:
            raise HTTPException(status_code=400, detail=f"Only {product.stock} items in stock")
        item.quantity = data.quantity

    db.commit()
    cart = db.query(Cart).options(
        joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.images),
        joinedload(Cart.items).joinedload(CartItem.variant),
    ).filter(Cart.id == cart.id).first()
    return build_cart_out(cart, db)


@router.delete("/items/{item_id}", response_model=CartOut)
async def remove_cart_item(
    item_id: int,
    session_id: Optional[str] = Cookie(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Remove item from cart"""
    cart = get_or_create_cart(db, current_user, session_id)
    item = db.query(CartItem).filter(
        CartItem.id == item_id, CartItem.cart_id == cart.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(item)
    db.commit()
    cart = db.query(Cart).options(
        joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.images),
        joinedload(Cart.items).joinedload(CartItem.variant),
    ).filter(Cart.id == cart.id).first()
    return build_cart_out(cart, db)


@router.delete("")
async def clear_cart(
    session_id: Optional[str] = Cookie(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Clear all items from cart"""
    cart = get_or_create_cart(db, current_user, session_id)
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    return {"message": "Cart cleared"}


# --- WISHLIST ---
wishlist_router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@wishlist_router.get("", response_model=list)
async def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = db.query(Wishlist).options(
        joinedload(Wishlist.product).joinedload(Product.images)
    ).filter(Wishlist.user_id == current_user.id).all()

    result = []
    for item in items:
        p = item.product
        if not p:
            continue
        main_img = next((img for img in p.images if img.is_main), None)
        if not main_img and p.images:
            main_img = p.images[0]
        result.append({
            "id": item.id,
            "product_id": p.id,
            "product_name": p.name,
            "product_slug": p.slug,
            "product_image": main_img.image_url if main_img else None,
            "price": p.price,
            "final_price": p.final_price,
            "stock": p.stock,
        })
    return result


@wishlist_router.post("/{product_id}")
async def add_to_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.product_id == product_id,
    ).first()
    if existing:
        return {"message": "Already in wishlist"}

    wishlist_item = Wishlist(user_id=current_user.id, product_id=product_id)
    db.add(wishlist_item)
    db.commit()
    return {"message": "Added to wishlist"}


@wishlist_router.delete("/{product_id}")
async def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.product_id == product_id,
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return {"message": "Removed from wishlist"}
