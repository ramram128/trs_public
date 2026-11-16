import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL

if db_url.startswith("mysql"):
    try:
        test_engine = create_engine(db_url, pool_pre_ping=True)
        with test_engine.connect() as conn:
            pass
    except Exception as e:
        logger.warning(f"MySQL connection to {db_url} failed ({e}). Falling back to SQLite: sqlite:///trs_imports.db")
        db_url = "sqlite:///trs_imports.db"

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
engine_kwargs = {
    "pool_pre_ping": True,
}
if not db_url.startswith("sqlite"):
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_schema():
    """Ensure database tables, columns, and default admin user exist"""
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        with engine.connect() as conn:
            if "orders" in table_names:
                columns = [c["name"] for c in inspector.get_columns("orders")]
                if "tracking_id" not in columns:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN tracking_id VARCHAR(100) NULL DEFAULT NULL"))
                if "courier_name" not in columns:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN courier_name VARCHAR(100) NULL DEFAULT NULL"))
                if "tracking_url" not in columns:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN tracking_url VARCHAR(500) NULL DEFAULT NULL"))
                if "coupon_code" not in columns:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) NULL DEFAULT NULL"))
                if "bank_slip_url" not in columns:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN bank_slip_url VARCHAR(1000) NULL DEFAULT NULL"))
                if "return_reason" not in columns:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN return_reason TEXT NULL DEFAULT NULL"))
                if "return_status" not in columns:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN return_status VARCHAR(50) NULL DEFAULT NULL"))
            if "products" in table_names:
                prod_columns = [c["name"] for c in inspector.get_columns("products")]
                if "moq" not in prod_columns:
                    conn.execute(text("ALTER TABLE products ADD COLUMN moq INTEGER DEFAULT 1"))
                if "bulk_tiers" not in prod_columns:
                    conn.execute(text("ALTER TABLE products ADD COLUMN bulk_tiers JSON NULL DEFAULT NULL"))
            if "contact_inquiries" in table_names:
                ci_columns = [c["name"] for c in inspector.get_columns("contact_inquiries")]
                if "inquiry_type" not in ci_columns:
                    conn.execute(text("ALTER TABLE contact_inquiries ADD COLUMN inquiry_type VARCHAR(50) DEFAULT 'general'"))
                if "company_name" not in ci_columns:
                    conn.execute(text("ALTER TABLE contact_inquiries ADD COLUMN company_name VARCHAR(255) NULL DEFAULT NULL"))
                if "target_qty" not in ci_columns:
                    conn.execute(text("ALTER TABLE contact_inquiries ADD COLUMN target_qty VARCHAR(100) NULL DEFAULT NULL"))
                if "target_price" not in ci_columns:
                    conn.execute(text("ALTER TABLE contact_inquiries ADD COLUMN target_price VARCHAR(100) NULL DEFAULT NULL"))
            if "payments" in table_names:
                p_columns = [c["name"] for c in inspector.get_columns("payments")]
                if "payment_type" not in p_columns:
                    conn.execute(text("ALTER TABLE payments ADD COLUMN payment_type VARCHAR(20) NULL DEFAULT NULL"))
            conn.commit()
    except Exception as e:
        logger.warning(f"ensure_schema warning: {e}")

    try:
        from app.models.user import User, UserRole
        from app.utils.security import hash_password
        db = SessionLocal()
        try:
            admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
            if not admin:
                admin = User(
                    name=settings.ADMIN_NAME,
                    email=settings.ADMIN_EMAIL,
                    password_hash=hash_password(settings.ADMIN_PASSWORD),
                    role=UserRole.admin,
                    is_active=True,
                )
                db.add(admin)
                db.commit()
            else:
                admin.password_hash = hash_password(settings.ADMIN_PASSWORD)
                admin.role = UserRole.admin
                admin.is_active = True
                db.commit()
        finally:
            db.close()
    except Exception:
        pass


def get_db():
    ensure_schema()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


