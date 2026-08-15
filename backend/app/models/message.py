from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class MessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)

class MessageResponse(BaseModel):
    id: str
    activity_id: str
    user_id: str
    username: str
    profile_image: Optional[str] = None
    message: str
    created_at: datetime

    class Config:
        populate_by_name = True
