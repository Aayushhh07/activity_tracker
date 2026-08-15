from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends
from bson import ObjectId

from app.database import get_streaks_collection, get_activities_collection, get_users_collection
from app.models.dashboard import (
    TodayActivityItem,
    DashboardSummary,
    FriendActivityItem,
    DashboardResponse
)
from app.services.auth import get_current_user
from app.services.streak_calculator import get_today_str, parse_date
from app.routers.activities import list_activities, get_trending_activities

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/today", response_model=List[TodayActivityItem])
async def get_today_activities(current_user: dict = Depends(get_current_user)):
    streaks_col = get_streaks_collection()
    activities_col = get_activities_collection()
    
    streaks = await streaks_col.find({"user_id": ObjectId(current_user["id"])}).to_list(length=100)
    if not streaks:
        return []
        
    act_ids = [s["activity_id"] for s in streaks]
    act_cursor = activities_col.find({"_id": {"$in": act_ids}})
    acts_map = {}
    async for a in act_cursor:
        acts_map[str(a["_id"])] = a
        
    today_str = get_today_str()
    items = []
    
    for s in streaks:
        a_id = str(s["activity_id"])
        act = acts_map.get(a_id, {})
        
        completed_today = False
        today_note = ""
        today_mood = None
        
        for l in s.get("logs", []):
            if str(l.get("date", ""))[:10] == today_str:
                completed_today = l.get("completed", False)
                today_note = l.get("notes", "")
                today_mood = l.get("mood")
                break
                
        items.append(TodayActivityItem(
            streak_id=str(s["_id"]),
            activity_id=a_id,
            name=act.get("name", "Untitled Activity"),
            description=act.get("description", ""),
            icon=act.get("icon", "🔥"),
            color=act.get("color", "#6366F1"),
            category=act.get("category", "General"),
            current_streak=s.get("current_streak", 0),
            longest_streak=s.get("longest_streak", 0),
            completed_today=completed_today,
            today_note=today_note,
            today_mood=today_mood,
            last_logged_date=s.get("last_logged_date")
        ))
        
    # Sort: pending activities first, then by current_streak descending
    items.sort(key=lambda x: (not x.completed_today, x.current_streak), reverse=True)
    return items

@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    streaks_col = get_streaks_collection()
    streaks = await streaks_col.find({"user_id": ObjectId(current_user["id"])}).to_list(length=100)
    
    total_streaks = len(streaks)
    today_str = get_today_str()
    
    completed_today_count = 0
    total_active_streaks = 0
    longest_across_all = 0
    total_completions_all_time = 0
    streak_sum = 0
    
    day_counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    all_logged_days_count = 0
    
    for s in streaks:
        c_streak = s.get("current_streak", 0)
        l_streak = s.get("longest_streak", 0)
        
        if c_streak > 0:
            total_active_streaks += 1
            streak_sum += c_streak
            
        longest_across_all = max(longest_across_all, l_streak)
        
        for l in s.get("logs", []):
            all_logged_days_count += 1
            if l.get("completed", False):
                total_completions_all_time += 1
                try:
                    d = parse_date(str(l.get("date", "")))
                    day_counts[d.weekday()] += 1
                except Exception:
                    pass
                if str(l.get("date", ""))[:10] == today_str:
                    completed_today_count += 1
                    
    progress_pct = round((completed_today_count / total_streaks * 100), 1) if total_streaks > 0 else 0.0
    consistency_pct = round((total_completions_all_time / all_logged_days_count * 100), 1) if all_logged_days_count > 0 else 0.0
    
    best_day_idx = max(day_counts, key=day_counts.get)
    best_day = day_names[best_day_idx] if sum(day_counts.values()) > 0 else "Monday"
    
    return DashboardSummary(
        total_active_streaks=total_active_streaks,
        completed_today_count=completed_today_count,
        total_today_activities=total_streaks,
        today_progress_percent=progress_pct,
        overall_consistency_rate=consistency_pct,
        longest_streak_across_all=longest_across_all,
        total_completions_all_time=total_completions_all_time,
        best_day_of_week=best_day,
        current_active_streak_sum=streak_sum
    )

@router.get("/friends", response_model=List[FriendActivityItem])
async def get_friends_activity_feed(current_user: dict = Depends(get_current_user)):
    users_col = get_users_collection()
    streaks_col = get_streaks_collection()
    activities_col = get_activities_collection()
    
    friend_ids = current_user.get("friends", [])
    if not friend_ids:
        # If user has no friends, get recent public completions as community feed
        other_streaks_cursor = streaks_col.find({
            "user_id": {"$ne": ObjectId(current_user["id"])}
        }).limit(20)
        other_streaks = await other_streaks_cursor.to_list(length=20)
    else:
        other_streaks_cursor = streaks_col.find({
            "user_id": {"$in": [ObjectId(f) if isinstance(f, str) else f for f in friend_ids]}
        }).limit(50)
        other_streaks = await other_streaks_cursor.to_list(length=50)
        
    if not other_streaks:
        return []
        
    # Get user info and activity info
    user_ids = list({s["user_id"] for s in other_streaks})
    act_ids = list({s["activity_id"] for s in other_streaks})
    
    users_map = {}
    async for u in users_col.find({"_id": {"$in": user_ids}}):
        users_map[str(u["_id"])] = u
        
    acts_map = {}
    async for a in activities_col.find({"_id": {"$in": act_ids}}):
        acts_map[str(a["_id"])] = a
        
    today_str = get_today_str()
    feed = []
    
    for s in other_streaks:
        u_id = str(s["user_id"])
        a_id = str(s["activity_id"])
        
        user_info = users_map.get(u_id, {})
        act_info = acts_map.get(a_id, {})
        
        logs = s.get("logs", [])
        completed_today = False
        latest_log = None
        
        for l in logs:
            if str(l.get("date", ""))[:10] == today_str and l.get("completed", False):
                completed_today = True
                latest_log = l
                break
                
        if not latest_log and logs:
            latest_log = logs[-1]
            
        feed.append(FriendActivityItem(
            user_id=u_id,
            username=user_info.get("username", "Friend"),
            profile_image=user_info.get("profile_image"),
            activity_id=a_id,
            activity_name=act_info.get("name", "Activity"),
            activity_icon=act_info.get("icon", "🔥"),
            activity_color=act_info.get("color", "#6366F1"),
            current_streak=s.get("current_streak", 0),
            completed_today=completed_today,
            logged_at=latest_log.get("logged_at") if latest_log else s.get("updated_at"),
            notes=latest_log.get("notes") if latest_log else None,
            mood=latest_log.get("mood") if latest_log else None
        ))
        
    feed.sort(key=lambda x: (x.completed_today, x.current_streak), reverse=True)
    return feed[:25]

@router.get("", response_model=DashboardResponse)
async def get_full_dashboard(current_user: dict = Depends(get_current_user)):
    today_items = await get_today_activities(current_user)
    summary_data = await get_dashboard_summary(current_user)
    friends_feed = await get_friends_activity_feed(current_user)
    trending = await get_trending_activities(limit=4, current_user=current_user)
    new_acts = await list_activities(skip=0, limit=4, current_user=current_user)
    
    return DashboardResponse(
        today=today_items,
        summary=summary_data,
        friends_feed=friends_feed,
        trending_activities=trending,
        new_activities=new_acts
    )
