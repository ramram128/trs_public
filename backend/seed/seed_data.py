"""
Seed data script for TRS Products
Populates the database with sample data for testing
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import *
from app.utils.security import hash_password
from app.utils.helpers import generate_slug, calculate_final_price
from app.routers.settings import DEFAULT_SETTINGS, initialize_default_settings
from datetime import datetime, timedelta
import random
import asyncio


def seed():
    db = SessionLocal()
    try:
        print("🌱 Starting database seed...")

        # --- USERS ---
        admin_exists = db.query(User).filter(User.email == "admin@trsimports.com").first()
        if not admin_exists:
            admin = User(
                name="TRS Admin",
                email="admin@trsimports.com",
                phone="+94742975043",
                password_hash=hash_password("Admin@123456"),
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin)
            print("  ✅ Admin user created: admin@trsimports.com / Admin@123456")

        customer_exists = db.query(User).filter(User.email == "customer@test.com").first()
        if not customer_exists:
            customer = User(
                name="Test Customer",
                email="customer@test.com",
                phone="+94771234567",
                password_hash=hash_password("Customer@123"),
                role=UserRole.customer,
                address="123 Main Street",
                city="Colombo",
                country="Sri Lanka",
                is_active=True,
            )
            db.add(customer)
            print("  ✅ Customer user created: customer@test.com / Customer@123")

        db.commit()

        # --- CATEGORIES ---
        categories_data = [
            {
                "name": "Groceries & Food",
                "slug": "groceries-food",
                "description": "Fresh and quality grocery items for everyday cooking",
                "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
                "sort_order": 1,
            },
            {
                "name": "Dry Fruits & Nuts",
                "slug": "dry-fruits-nuts",
                "description": "Premium quality dry fruits, nuts and seeds",
                "image": "https://images.unsplash.com/photo-1611132696668-dbef26a5e0b2?w=400",
                "sort_order": 2,
            },
            {
                "name": "Beverages & Drinks",
                "slug": "beverages-drinks",
                "description": "Refreshing drinks and premium beverages",
                "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400",
                "sort_order": 3,
            },
            {
                "name": "Spices & Seasonings",
                "slug": "spices-seasonings",
                "description": "Authentic spices and seasonings for flavorful cooking",
                "image": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400",
                "sort_order": 4,
            },
            {
                "name": "Personal Care & Hygiene",
                "slug": "personal-care-hygiene",
                "description": "Quality personal care and hygiene products",
                "image": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
                "sort_order": 5,
            },
            {
                "name": "Household Essentials",
                "slug": "household-essentials",
                "description": "Essential products for your home",
                "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
                "sort_order": 6,
            },
            {
                "name": "Electronics & Accessories",
                "slug": "electronics-accessories",
                "description": "Quality electronics and accessories",
                "image": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400",
                "sort_order": 7,
            },
            {
                "name": "Fashion & Lifestyle",
                "slug": "fashion-lifestyle",
                "description": "Trendy fashion and lifestyle products",
                "image": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400",
                "sort_order": 8,
            },
        ]

        cat_map = {}
        for cat_data in categories_data:
            existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            if not existing:
                cat = Category(**cat_data, status=True)
                db.add(cat)
                db.flush()
                cat_map[cat_data["slug"]] = cat.id
                print(f"  ✅ Category: {cat_data['name']}")
            else:
                cat_map[cat_data["slug"]] = existing.id

        db.commit()

        # --- PRODUCTS ---
        products_data = [
            {
                "name": "Premium Almonds (1kg)",
                "sku": "TRS-NUT-001",
                "category_slug": "dry-fruits-nuts",
                "description": "Fresh premium quality almonds sourced directly from California farms. Rich in protein, healthy fats, and vitamin E.",
                "price": 2800,
                "discount_percent": 18,
                "stock": 150,
                "unit": "kg",
                "is_featured": True,
                "is_best_seller": True,
                "image": "https://images.unsplash.com/photo-1574856344991-aaa31b6f4ce3?w=600",
                "tags": "almonds, nuts, dry fruits, healthy",
            },
            {
                "name": "Pistachios Premium (1kg)",
                "sku": "TRS-NUT-002",
                "category_slug": "dry-fruits-nuts",
                "description": "Roasted and salted pistachios from Iran. A delicious and nutritious snack packed with antioxidants.",
                "price": 3500,
                "discount_percent": 21,
                "stock": 100,
                "unit": "kg",
                "is_featured": True,
                "is_best_seller": True,
                "image": "https://images.unsplash.com/photo-1590080874088-eec64895b423?w=600",
                "tags": "pistachios, nuts, dry fruits, premium",
            },
            {
                "name": "Cashew Nuts W240 (1kg)",
                "sku": "TRS-NUT-003",
                "category_slug": "dry-fruits-nuts",
                "description": "Premium grade W240 cashew nuts from Sri Lanka. Creamy texture with rich flavor. Perfect for cooking and snacking.",
                "price": 2500,
                "discount_percent": 22,
                "stock": 200,
                "unit": "kg",
                "is_featured": True,
                "image": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600",
                "tags": "cashews, nuts, sri lanka, premium",
            },
            {
                "name": "Medjool Dates (1kg)",
                "sku": "TRS-FRT-001",
                "category_slug": "dry-fruits-nuts",
                "description": "Luxurious Medjool dates from Jordan. Naturally sweet, soft and chewy. The king of dates.",
                "price": 1800,
                "discount_percent": 22,
                "stock": 120,
                "unit": "kg",
                "is_featured": True,
                "is_new_arrival": True,
                "image": "https://images.unsplash.com/photo-1584363586842-9f4e79d4e94b?w=600",
                "tags": "dates, medjool, dry fruits, healthy",
            },
            {
                "name": "Extra Virgin Olive Oil (1L)",
                "sku": "TRS-OIL-001",
                "category_slug": "groceries-food",
                "description": "Cold-pressed extra virgin olive oil from Spain. Rich in healthy monounsaturated fats and antioxidants.",
                "price": 3500,
                "discount_percent": 17,
                "stock": 80,
                "unit": "L",
                "is_featured": True,
                "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600",
                "tags": "olive oil, cooking oil, spain, healthy",
            },
            {
                "name": "Basmati Rice Premium (5kg)",
                "sku": "TRS-RIC-001",
                "category_slug": "groceries-food",
                "description": "Long grain aged Basmati rice with a delicate aroma. Imported from the foothills of the Himalayas.",
                "price": 1500,
                "discount_percent": 20,
                "stock": 300,
                "unit": "kg",
                "is_featured": True,
                "is_best_seller": True,
                "image": "https://images.unsplash.com/photo-1536304993881-ff86e0c9c783?w=600",
                "tags": "basmati, rice, india, premium",
            },
            {
                "name": "Organic Honey (500g)",
                "sku": "TRS-HON-001",
                "category_slug": "groceries-food",
                "description": "Pure organic wildflower honey. No added sugar or preservatives. Rich in antioxidants and antibacterial properties.",
                "price": 1200,
                "discount_percent": 15,
                "stock": 90,
                "unit": "g",
                "is_new_arrival": True,
                "image": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600",
                "tags": "honey, organic, natural, healthy",
            },
            {
                "name": "Ceylon Black Tea (500g)",
                "sku": "TRS-TEA-001",
                "category_slug": "beverages-drinks",
                "description": "Premium Ceylon black tea directly from the highlands of Sri Lanka. Bold flavor with a rich amber color.",
                "price": 850,
                "discount_percent": 10,
                "stock": 200,
                "unit": "g",
                "is_featured": True,
                "is_best_seller": True,
                "image": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600",
                "tags": "ceylon tea, black tea, sri lanka, premium",
            },
            {
                "name": "Saffron Premium Quality (5g)",
                "sku": "TRS-SPI-001",
                "category_slug": "spices-seasonings",
                "description": "Authentic Persian saffron threads - the world's most precious spice. Adds vibrant color and unique flavor.",
                "price": 4500,
                "discount_percent": 10,
                "stock": 50,
                "unit": "g",
                "is_new_arrival": True,
                "image": "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=600",
                "tags": "saffron, spices, persian, premium",
            },
            {
                "name": "Mixed Dry Fruits Gift Box (500g)",
                "sku": "TRS-GFT-001",
                "category_slug": "dry-fruits-nuts",
                "description": "Premium mixed dry fruits gift box containing almonds, cashews, pistachios, raisins and dates. Perfect for gifting.",
                "price": 2200,
                "discount_percent": 12,
                "stock": 60,
                "unit": "g",
                "is_featured": True,
                "is_new_arrival": True,
                "is_best_seller": True,
                "image": "https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=600",
                "tags": "gift box, dry fruits, mixed nuts, premium",
            },
            {
                "name": "Coconut Oil Pure (1L)",
                "sku": "TRS-OIL-002",
                "category_slug": "groceries-food",
                "description": "Cold-pressed virgin coconut oil from Sri Lanka. Perfect for cooking, skin care and hair care.",
                "price": 1100,
                "discount_percent": 15,
                "stock": 150,
                "unit": "L",
                "is_featured": True,
                "image": "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=600",
                "tags": "coconut oil, virgin, sri lanka, cooking",
            },
            {
                "name": "Walnuts Premium (500g)",
                "sku": "TRS-NUT-004",
                "category_slug": "dry-fruits-nuts",
                "description": "Premium quality walnuts rich in omega-3 fatty acids. Excellent for brain health and heart health.",
                "price": 1900,
                "discount_percent": 15,
                "stock": 110,
                "unit": "g",
                "is_new_arrival": True,
                "image": "https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=600",
                "tags": "walnuts, nuts, omega-3, healthy",
            },
            {
                "name": "Green Tea Premium (50 bags)",
                "sku": "TRS-TEA-002",
                "category_slug": "beverages-drinks",
                "description": "Premium green tea bags with delicate flavor and high antioxidant content. Supports weight management.",
                "price": 650,
                "discount_percent": 8,
                "stock": 180,
                "unit": "bags",
                "is_new_arrival": True,
                "image": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600",
                "tags": "green tea, antioxidants, healthy, slimming",
            },
            {
                "name": "Turmeric Powder Organic (250g)",
                "sku": "TRS-SPI-002",
                "category_slug": "spices-seasonings",
                "description": "Certified organic turmeric powder with high curcumin content. Anti-inflammatory and antioxidant properties.",
                "price": 450,
                "discount_percent": 10,
                "stock": 250,
                "unit": "g",
                "is_best_seller": True,
                "image": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600",
                "tags": "turmeric, organic, spices, health",
            },
            {
                "name": "Raisins Seedless (500g)",
                "sku": "TRS-FRT-002",
                "category_slug": "dry-fruits-nuts",
                "description": "Plump and juicy seedless raisins from Afghanistan. Natural sweetness with no added sugar.",
                "price": 680,
                "discount_percent": 12,
                "stock": 200,
                "unit": "g",
                "image": "https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=600",
                "tags": "raisins, dried grapes, healthy, sweet",
            },
            {
                "name": "Black Seed Oil (250ml)",
                "sku": "TRS-OIL-003",
                "category_slug": "personal-care-hygiene",
                "description": "Pure cold-pressed black seed (Nigella Sativa) oil. Used for centuries for health and wellness benefits.",
                "price": 1800,
                "discount_percent": 12,
                "stock": 75,
                "unit": "ml",
                "is_new_arrival": True,
                "image": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600",
                "tags": "black seed oil, nigella sativa, health, immunity",
            },
            {
                "name": "Chia Seeds Organic (500g)",
                "sku": "TRS-SED-001",
                "category_slug": "groceries-food",
                "description": "Organic chia seeds packed with omega-3, fiber, and protein. Excellent superfood for health-conscious people.",
                "price": 950,
                "discount_percent": 15,
                "stock": 130,
                "unit": "g",
                "is_featured": True,
                "image": "https://images.unsplash.com/photo-1514214679531-5db0c05434a7?w=600",
                "tags": "chia seeds, superfood, organic, omega-3",
            },
            {
                "name": "Pine Nuts Premium (250g)",
                "sku": "TRS-NUT-005",
                "category_slug": "dry-fruits-nuts",
                "description": "Premium quality pine nuts (pignoli) with buttery flavor. Perfect for pesto, salads and cooking.",
                "price": 2200,
                "discount_percent": 10,
                "stock": 45,
                "unit": "g",
                "image": "https://images.unsplash.com/photo-1574856344991-aaa31b6f4ce3?w=600",
                "tags": "pine nuts, pignoli, cooking, premium",
            },
            {
                "name": "Apple Cider Vinegar (500ml)",
                "sku": "TRS-VIN-001",
                "category_slug": "groceries-food",
                "description": "Raw, unfiltered apple cider vinegar with the mother. Supports digestion and weight management.",
                "price": 800,
                "discount_percent": 10,
                "stock": 95,
                "unit": "ml",
                "is_new_arrival": True,
                "image": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600",
                "tags": "apple cider vinegar, health, digestion",
            },
            {
                "name": "Flaxseeds Gold (500g)",
                "sku": "TRS-SED-002",
                "category_slug": "groceries-food",
                "description": "Golden flaxseeds rich in omega-3 fatty acids, lignans and fiber. Add to smoothies, yogurt or baked goods.",
                "price": 550,
                "discount_percent": 10,
                "stock": 160,
                "unit": "g",
                "image": "https://images.unsplash.com/photo-1514214679531-5db0c05434a7?w=600",
                "tags": "flaxseeds, omega-3, fiber, healthy",
            },
        ]

        for prod_data in products_data:
            existing = db.query(Product).filter(Product.sku == prod_data["sku"]).first()
            if not existing:
                cat_id = cat_map.get(prod_data.pop("category_slug"))
                image_url = prod_data.pop("image")
                final_price = calculate_final_price(prod_data["price"], prod_data["discount_percent"])

                slug = generate_slug(prod_data["name"])
                product = Product(
                    slug=slug,
                    category_id=cat_id,
                    final_price=final_price,
                    low_stock_threshold=10,
                    status=True,
                    **{k: v for k, v in prod_data.items()},
                )
                db.add(product)
                db.flush()

                # Add main image
                img = ProductImage(
                    product_id=product.id,
                    image_url=image_url,
                    is_main=True,
                    sort_order=0,
                )
                db.add(img)
                print(f"  ✅ Product: {prod_data['name']}")

        db.commit()

        # --- SETTINGS ---
        for s in DEFAULT_SETTINGS:
            existing = db.query(Setting).filter(Setting.key == s["key"]).first()
            if not existing:
                db.add(Setting(**s))
        db.commit()
        print("  ✅ Default settings seeded")

        print("\n🎉 Database seeded successfully!")
        print("\n📋 Test Credentials:")
        print("   Admin: admin@trsimports.com / Admin@123456")
        print("   Customer: customer@test.com / Customer@123")
        print("\n🌐 API Docs: http://localhost:8000/docs")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    # Create tables first
    Base.metadata.create_all(bind=engine)
    seed()
