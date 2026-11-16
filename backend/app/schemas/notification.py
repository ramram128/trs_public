from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    related_id: Optional[str] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
