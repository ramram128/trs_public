from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/trs_imports"

    # JWT
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AWS S3
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET: str = "trs-imports-media"

    # Email Configuration (SMTP: Gmail, Outlook, or Custom SMTP)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    FROM_EMAIL: str = "support@trsimports.com"
    FROM_NAME: str = "TRS Products"

    # SendGrid / Resend / Brevo (Password-Free API Alternatives)
    RESEND_API_KEY: Optional[str] = None
    RESEND_FROM: str = "onboarding@resend.dev"
    BREVO_API_KEY: Optional[str] = None
    SENDGRID_API_KEY: Optional[str] = None

    # PayHere
    PAYHERE_MERCHANT_ID: Optional[str] = None
    PAYHERE_MERCHANT_SECRET: Optional[str] = None
    PAYHERE_SANDBOX: bool = True
    PAYHERE_API_URL: str = "https://sandbox.payhere.lk/pay/checkout"

    # App
    APP_NAME: str = "TRS Products"
    APP_URL: str = "http://localhost:5173"
    API_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"

    # Admin
    ADMIN_EMAIL: str = "admin@trsimports.com"
    ADMIN_PASSWORD: str = "Admin@123456"
    ADMIN_NAME: str = "TRS Admin"

    # WhatsApp
    WHATSAPP_NUMBER: str = "94742975043"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
