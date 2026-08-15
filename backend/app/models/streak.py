from datetime import datetime, date
from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from app.models.activity import ActivityResponse

MoodType = Literal["great", "good", "okay", "bad", ""]

class LogEntry(BaseModel):
    date: str  # Format: YYYY-MM-DD
    completed: bool = True
    notes: Optional[str] = Field(default="", max_length=500)
    mood: Optional[str] = Field(default=None)  # "great" | "good" | "okay" | "bad"
    logged_at: datetime = Field(default_factory=datetime.utcnow)

class StreakCreate(BaseModel):
    activity_id: str

class StreakLogRequest(BaseModel):
    completed: bool = True
    notes: Optional[str] = Field(default="", max_length=500)
    mood: Optional[str] = None
    date: Optional[str] = None # YYYY-MM-DD, defaults to today if not provided

class StreakStats(BaseModel):
    total_days_logged: int = 0
    total_completed_days: int = 0
    consistency_percentage: float = 0.0
    best_day_of_week: Optional[str] = "Monday"
    current_streak: int = 0
    longest_streak: int = 0
    weekly_completion: List[dict] = [] # e.g. [{"day": "Mon", "completed": True}, ...]
    monthly_heatmap: List[dict] = [] # list of { date: "YYYY-MM-DD", count: 1, mood: "..." }

class StreakResponse(BaseModel):
    id: str
    user_id: str
    activity_id: str
    activity: Optional[ActivityResponse] = None
    current_streak: int = 0
    longest_streak: int = 0
    last_logged_date: Optional[str] = None
    completed_today: bool = False
    today_log: Optional[LogEntry] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

class StreakDetailResponse(StreakResponse):
    logs: List[LogEntry] = []
    stats: Optional[StreakStats] = None
