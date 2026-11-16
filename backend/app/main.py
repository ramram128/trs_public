from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
import os

from app.config import settings
from app.database import engine, Base
from app.routers import auth, categories, products, search, orders, payments, admin, settings as settings_router
from app.routers.cart import router as cart_router, wishlist_router
from app.routers.coupons import router as coupons_router
from app.routers.reviews import router as reviews_router
from app.routers.addresses import router as addresses_router
from app.routers.contact import router as contact_router
from app.routers.newsletter import router as newsletter_router
from app.routers.banners import router as banners_router
from app.routers.notifications import router as notifications_router

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create uploads directory
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/products", exist_ok=True)
os.makedirs("uploads/categories", exist_ok=True)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="TRS Products API",
    description="E-Commerce REST API for TRS Products — Quality · Trust · Goodness",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
# Allow the production Vercel frontend to call this API.
allowed_origins.append("https://trading-retail-solutions.vercel.app")
for p in range(3000, 3010):
    allowed_origins.append(f"http://localhost:{p}")
    allowed_origins.append(f"http://127.0.0.1:{p}")
for p in range(5170, 5185):
    allowed_origins.append(f"http://localhost:{p}")
    allowed_origins.append(f"http://127.0.0.1:{p}")
allowed_origins = list(set(allowed_origins))
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for local uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Create DB tables & ensure schema migration
@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        if "orders" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("orders")]
            with engine.connect() as conn:
                if "tracking_id" not in columns:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN tracking_id VARCHAR(100) NULL DEFAULT NULL"))
                    logger.info("Added tracking_id column to orders table")
                if "courier_name" not in columns:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN courier_name VARCHAR(100) NULL DEFAULT NULL"))
                    logger.info("Added courier_name column to orders table")
                if "tracking_url" not in columns:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN tracking_url VARCHAR(500) NULL DEFAULT NULL"))
                    logger.info("Added tracking_url column to orders table")
                conn.commit()
    except Exception as e:
        logger.warning(f"Schema migration note: {e}")
    logger.info("✅ TRS Products API started")
    logger.info(f"📚 Docs: http://localhost:8000/docs")


# Health check
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": "1.0.0"}


@app.get("/robots.txt")
def robots_txt():
    content = f"""User-agent: *
Allow: /
Disallow: /admin
Disallow: /account

Sitemap: {settings.FRONTEND_URL or 'http://localhost:5173'}/sitemap.xml
"""
    return JSONResponse(content=content, media_type="text/plain")


@app.get("/sitemap.xml")
def sitemap_xml():
    from app.database import SessionLocal
    from app.models.product import Product
    from app.models.category import Category
    from fastapi.responses import Response
    db = SessionLocal()
    try:
        frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
        static_pages = ["", "/products", "/categories", "/about", "/contact", "/offers", "/faq", "/track-order"]
        urls = [f"<url><loc>{frontend_url}{p}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>" for p in static_pages]

        cats = db.query(Category).filter(Category.status == True).all()
        for c in cats:
            urls.append(f"<url><loc>{frontend_url}/category/{c.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>")

        prods = db.query(Product).filter(Product.status == True).all()
        for p in prods:
            urls.append(f"<url><loc>{frontend_url}/products/{p.slug}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>")

        xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{''.join(urls)}
</urlset>"""
        return Response(content=xml_content, media_type="application/xml")
    finally:
        db.close()


# API routes
API_PREFIX = "/api"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(categories.router, prefix=API_PREFIX)
app.include_router(products.router, prefix=API_PREFIX)
app.include_router(search.router, prefix=API_PREFIX)
app.include_router(cart_router, prefix=API_PREFIX)
app.include_router(wishlist_router, prefix=API_PREFIX)
app.include_router(orders.router, prefix=API_PREFIX)
app.include_router(payments.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(settings_router.router, prefix=API_PREFIX)
app.include_router(coupons_router, prefix=API_PREFIX)
app.include_router(reviews_router, prefix=API_PREFIX)
app.include_router(addresses_router, prefix=API_PREFIX)
app.include_router(contact_router, prefix=API_PREFIX)
app.include_router(newsletter_router, prefix=API_PREFIX)
app.include_router(banners_router, prefix=API_PREFIX)
app.include_router(notifications_router, prefix=API_PREFIX)


# Global exception handler
# @app.exception_handler(Exception)
# async def global_exception_handler(request: Request, exc: Exception):
#     logger.error(f"Unhandled exception: {exc}", exc_info=True)
#     return JSONResponse(
#         status_code=500,
#         content={"detail": "An internal server error occurred"},
#     )
# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    origin = request.headers.get("origin")
    headers = {}
    if origin and origin in allowed_origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred"},
        headers=headers,
    )
