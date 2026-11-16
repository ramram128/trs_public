import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException
import uuid
import os
from app.config import settings

# Allowed image types
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def get_s3_client():
    kwargs = {
        "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
        "region_name": settings.AWS_REGION or "auto",
    }
    if settings.AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.AWS_ENDPOINT_URL
    return boto3.client("s3", **kwargs)


async def upload_image_to_s3(
    file: UploadFile,
    folder: str = "products",
) -> str:
    """Upload image file to AWS S3 / Cloudflare R2 and return URL"""
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not allowed. Use JPEG, PNG, or WebP.",
        )

    # Read file content
    contents = await file.read()

    # Validate file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    # Generate unique filename
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{folder}/{uuid.uuid4().hex}.{ext}"

    try:
        s3_client = get_s3_client()
        s3_client.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=filename,
            Body=contents,
            ContentType=file.content_type,
        )
        if settings.AWS_S3_CUSTOM_DOMAIN:
            domain = settings.AWS_S3_CUSTOM_DOMAIN.rstrip("/")
            if not domain.startswith("http://") and not domain.startswith("https://"):
                domain = f"https://{domain}"
            url = f"{domain}/{filename}"
        else:
            url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{filename}"
        return url
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")


def delete_image_from_s3(image_url: str) -> bool:
    """Delete image from AWS S3"""
    try:
        # Extract key from URL
        bucket_base = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/"
        if not image_url.startswith(bucket_base):
            return False
        key = image_url.replace(bucket_base, "")
        s3_client = get_s3_client()
        s3_client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=key)
        return True
    except Exception:
        return False


# Fallback: local file storage for development
LOCAL_UPLOAD_DIR = "uploads"


async def upload_image_local(file: UploadFile, folder: str = "products") -> str:
    """Upload image to local storage (development fallback)"""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB")

    os.makedirs(f"{LOCAL_UPLOAD_DIR}/{folder}", exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = f"{LOCAL_UPLOAD_DIR}/{folder}/{filename}"

    with open(filepath, "wb") as f:
        f.write(contents)

    api_url = os.getenv("RENDER_EXTERNAL_URL")
    if not api_url:
        if settings.API_URL and not settings.API_URL.startswith("http://localhost"):
            api_url = settings.API_URL
        elif settings.ENVIRONMENT == "production":
            api_url = "https://trs-backend-asmu.onrender.com"
        else:
            api_url = settings.API_URL or "http://localhost:8000"

    return f"{api_url}/uploads/{folder}/{filename}"


async def upload_image(file: UploadFile, folder: str = "products") -> str:
    """Upload image - uses S3 if configured, else local storage"""
    aws_key = settings.AWS_ACCESS_KEY_ID
    aws_secret = settings.AWS_SECRET_ACCESS_KEY
    if (
        aws_key
        and aws_secret
        and not aws_key.startswith("your-")
        and not aws_secret.startswith("your-")
    ):
        return await upload_image_to_s3(file, folder)
    return await upload_image_local(file, folder)
