from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ActivityBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    description: Optional[str] = Field(default="", max_length=500)
    category: str = Field(default="Health & Fitness")
    is_public: bool = True
    icon: str = Field(default="🔥")
    color: str = Field(default="#6366F1") # Indigo hex

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=80)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = None
    is_public: Optional[bool] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class ActivityResponse(ActivityBase):
    id: str
    creator_id: str
    creator_username: Optional[str] = None
    created_at: datetime
    tracking_count: int = 0
    is_tracking: bool = False
    user_streak_id: Optional[str] = None

    class Config:
        populate_by_name = True

class ActivityParticipant(BaseModel):
    user_id: str
    username: str
    profile_image: Optional[str] = None
    current_streak: int
    completed_today: bool
    is_friend: bool = False
    today_note: Optional[str] = None
    today_mood: Optional[str] = None

class ActivityDetailResponse(ActivityResponse):
    participants: List[ActivityParticipant] = []
    total_logs_count: int = 0
    average_streak: float = 0.0
    longest_active_streak: int = 0
