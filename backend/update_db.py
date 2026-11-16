import sqlite3

def clean_and_seed():
    conn = sqlite3.connect('trs_imports.db')
    cursor = conn.cursor()
    
    try:
        # Delete unwanted products and categories
        cursor.execute("DELETE FROM product_images")
        cursor.execute("DELETE FROM products")
        cursor.execute("DELETE FROM categories")
        
        # New categories
        new_categories = [
            "Women’s Handbags",
            "Women’s & Men’s Clothing",
            "Shoes & Sandals",
            "Fashion Accessories",
            "Watches & Sunglasses",
            "Beauty & Personal Care Items",
            "Mobile Accessories",
            "Electronic Accessories",
            "Home & Kitchen Items",
            "Bags & Backpacks",
            "Toys & Kids’ Items",
            "Household Products",
            "Gift & Lifestyle Items",
            "Dry Fruits & Food Products",
            "Other Fast-Moving Consumer Products",
            "Home-made Food",
            "Ready-to-Eat Meals",
            "Home-made Snacks & Sweets",
            "Traditional Sri Lankan Food",
            "Freshly Prepared Food"
        ]
        
        import uuid
        import string
        import random
        
        def slugify(text):
            return text.lower().replace(' & ', '-').replace(' ', '-').replace('’', '').replace('s-', 's-')
            
        from datetime import datetime
        now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

        for name in new_categories:
            slug = slugify(name)
            cursor.execute("""
                INSERT INTO categories (name, slug, description, image, status, sort_order, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (name, slug, "Premium products from TRS", None, True, 0, now, now))
        
        conn.commit()
        print("Successfully removed old products/categories and seeded new categories.")
    except Exception as e:
        conn.rollback()
        print("Error:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    clean_and_seed()
