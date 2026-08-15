from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.models.common import PyObjectId

class UserBase(BaseModel):
    username: str
    email: EmailStr
    profile_image: Optional[str] = None
    bio: Optional[str] = None

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=6)
    profile_image: Optional[str] = None
    bio: Optional[str] = ""

class UserLogin(BaseModel):
    email: str # Can be email or username
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    friends: List[str] = []

    class Config:
        populate_by_name = True

class UserProfile(UserResponse):
    total_streaks_tracked: int = 0
    total_completions: int = 0
    longest_streak_ever: int = 0
    active_streaks_count: int = 0
    is_friend: bool = False

class FriendStatus(BaseModel):
    id: str
    username: str
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    active_streaks_count: int = 0
    completed_today_count: int = 0
    total_today_activities: int = 0

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
