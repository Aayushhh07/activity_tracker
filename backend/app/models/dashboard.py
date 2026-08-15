from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.activity import ActivityResponse

class TodayActivityItem(BaseModel):
    streak_id: str
    activity_id: str
    name: str
    description: Optional[str] = ""
    icon: str
    color: str
    category: str
    current_streak: int
    longest_streak: int
    completed_today: bool
    today_note: Optional[str] = ""
    today_mood: Optional[str] = None
    last_logged_date: Optional[str] = None

class DashboardSummary(BaseModel):
    total_active_streaks: int = 0
    completed_today_count: int = 0
    total_today_activities: int = 0
    today_progress_percent: float = 0.0
    overall_consistency_rate: float = 0.0
    longest_streak_across_all: int = 0
    total_completions_all_time: int = 0
    best_day_of_week: Optional[str] = "Monday"
    current_active_streak_sum: int = 0

class FriendActivityItem(BaseModel):
    user_id: str
    username: str
    profile_image: Optional[str] = None
    activity_id: str
    activity_name: str
    activity_icon: str
    activity_color: str
    current_streak: int
    completed_today: bool
    logged_at: Optional[datetime] = None
    notes: Optional[str] = None
    mood: Optional[str] = None

class DashboardResponse(BaseModel):
    today: List[TodayActivityItem] = []
    summary: DashboardSummary
    friends_feed: List[FriendActivityItem] = []
    trending_activities: List[ActivityResponse] = []
    new_activities: List[ActivityResponse] = []
