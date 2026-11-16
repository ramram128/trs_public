import sqlite3

def update_images():
    conn = sqlite3.connect('trs_imports.db')
    cursor = conn.cursor()
    
    # Mapping of category names to Unsplash image URLs
    category_images = {
        "Women’s Handbags": "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=500&q=80",
        "Women’s & Men’s Clothing": "https://images.unsplash.com/photo-1489987707023-af0825dad1b3?w=500&q=80",
        "Shoes & Sandals": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80",
        "Fashion Accessories": "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500&q=80",
        "Watches & Sunglasses": "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500&q=80",
        "Beauty & Personal Care Items": "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=500&q=80",
        "Mobile Accessories": "https://images.unsplash.com/photo-1601524909162-ae8725290836?w=500&q=80",
        "Electronic Accessories": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&q=80",
        "Home & Kitchen Items": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&q=80",
        "Bags & Backpacks": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80",
        "Toys & Kids’ Items": "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&q=80",
        "Household Products": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&q=80",
        "Gift & Lifestyle Items": "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80",
        "Dry Fruits & Food Products": "https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?w=500&q=80",
        "Other Fast-Moving Consumer Products": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80",
        "Home-made Food": "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=500&q=80",
        "Ready-to-Eat Meals": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=500&q=80",
        "Home-made Snacks & Sweets": "https://images.unsplash.com/photo-1581486749028-c11c47012674?w=500&q=80",
        "Traditional Sri Lankan Food": "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=500&q=80",
        "Freshly Prepared Food": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&q=80"
    }

    try:
        for name, image_url in category_images.items():
            cursor.execute("""
                UPDATE categories SET image = ? WHERE name = ?
            """, (image_url, name))
            
        conn.commit()
        print("Successfully updated category images.")
    except Exception as e:
        conn.rollback()
        print("Error:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    update_images()
