from sqlalchemy import Column, String, DateTime, LargeBinary, Integer
from sqlalchemy.sql import func
from app.database import Base


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(String(64), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    size = Column(Integer, nullable=False)
    data = Column(LargeBinary(length=16777215), nullable=False)  # MEDIUMBLOB up to 16MB
    created_at = Column(DateTime(timezone=True), server_default=func.now())
