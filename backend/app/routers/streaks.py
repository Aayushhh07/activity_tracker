from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query
from bson import ObjectId

from app.database import get_streaks_collection, get_activities_collection, get_users_collection
from app.models.streak import (
    StreakCreate,
    StreakLogRequest,
    StreakResponse,
    StreakDetailResponse,
    LogEntry
)
from app.models.common import fix_id
from app.services.auth import get_current_user
from app.services.streak_calculator import (
    calculate_streaks,
    calculate_streak_stats,
    get_today_str
)
from app.routers.activities import build_activity_response

router = APIRouter(prefix="/streaks", tags=["Streaks"])

async def build_streak_response(doc: dict, current_user: dict) -> StreakResponse:
    streak_data = fix_id(doc)
    act_id = doc.get("activity_id")
    
    # Populate activity
    activities_col = get_activities_collection()
    act_doc = await activities_col.find_one({"_id": ObjectId(str(act_id))})
    activity_resp = None
    if act_doc:
        activity_resp = await build_activity_response(act_doc, current_user)
        
    logs = doc.get("logs", [])
    today_str = get_today_str()
    
    completed_today = False
    today_log = None
    
    for l in logs:
        if str(l.get("date", ""))[:10] == today_str:
            today_log = LogEntry(**l)
            completed_today = l.get("completed", False)
            break
            
    return StreakResponse(
        **streak_data,
        activity=activity_resp,
        completed_today=completed_today,
        today_log=today_log
    )

@router.post("", response_model=StreakResponse, status_code=status.HTTP_201_CREATED)
async def join_activity(
    streak_in: StreakCreate,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(streak_in.activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID format")
        
    activities_col = get_activities_collection()
    streaks_col = get_streaks_collection()
    
    act_doc = await activities_col.find_one({"_id": ObjectId(streak_in.activity_id)})
    if not act_doc:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    # Check if already joined
    existing = await streaks_col.find_one({
        "user_id": ObjectId(current_user["id"]),
        "activity_id": ObjectId(streak_in.activity_id)
    })
    if existing:
        return await build_streak_response(existing, current_user)
        
    new_streak = {
        "user_id": ObjectId(current_user["id"]),
        "activity_id": ObjectId(streak_in.activity_id),
        "current_streak": 0,
        "longest_streak": 0,
        "last_logged_date": None,
        "logs": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    res = await streaks_col.insert_one(new_streak)
    new_streak["_id"] = res.inserted_id
    return await build_streak_response(new_streak, current_user)

@router.get("", response_model=List[StreakResponse])
async def get_user_streaks(
    current_user: dict = Depends(get_current_user)
):
    streaks_col = get_streaks_collection()
    cursor = streaks_col.find({"user_id": ObjectId(current_user["id"])}).sort("updated_at", -1)
    
    streaks = []
    async for doc in cursor:
        resp = await build_streak_response(doc, current_user)
        streaks.append(resp)
        
    return streaks

@router.get("/{streak_id}", response_model=StreakDetailResponse)
async def get_streak_detail(
    streak_id: str,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(streak_id):
        raise HTTPException(status_code=400, detail="Invalid streak ID format")
        
    streaks_col = get_streaks_collection()
    doc = await streaks_col.find_one({"_id": ObjectId(streak_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Streak not found")
        
    base_resp = await build_streak_response(doc, current_user)
    
    logs_raw = doc.get("logs", [])
    logs = [LogEntry(**l) for l in sorted(logs_raw, key=lambda x: str(x.get("date", ""))[:10], reverse=True)]
    
    # Calculate stats
    stats = calculate_streak_stats(
        logs_raw,
        current_streak=doc.get("current_streak", 0),
        longest_streak=doc.get("longest_streak", 0)
    )
    
    return StreakDetailResponse(
        **base_resp.model_dump(),
        logs=logs,
        stats=stats
    )

@router.delete("/{streak_id}")
async def stop_tracking_activity(
    streak_id: str,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(streak_id):
        raise HTTPException(status_code=400, detail="Invalid streak ID format")
        
    streaks_col = get_streaks_collection()
    doc = await streaks_col.find_one({"_id": ObjectId(streak_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Streak not found")
        
    if str(doc.get("user_id")) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this streak")
        
    await streaks_col.delete_one({"_id": ObjectId(streak_id)})
    return {"message": "Stopped tracking activity successfully"}

@router.post("/{streak_id}/log", response_model=StreakDetailResponse)
async def log_activity_entry(
    streak_id: str,
    log_in: StreakLogRequest,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(streak_id):
        raise HTTPException(status_code=400, detail="Invalid streak ID format")
        
    streaks_col = get_streaks_collection()
    doc = await streaks_col.find_one({"_id": ObjectId(streak_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Streak not found")
        
    if str(doc.get("user_id")) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to log for this streak")
        
    target_date = log_in.date if (log_in.date and len(log_in.date) >= 10) else get_today_str()
    
    existing_logs = doc.get("logs", [])
    updated_logs = []
    found = False
    
    for l in existing_logs:
        if str(l.get("date", ""))[:10] == target_date:
            # Update existing log for date
            updated_logs.append({
                "date": target_date,
                "completed": log_in.completed,
                "notes": log_in.notes if log_in.notes is not None else l.get("notes", ""),
                "mood": log_in.mood if log_in.mood is not None else l.get("mood"),
                "logged_at": datetime.utcnow()
            })
            found = True
        else:
            updated_logs.append(l)
            
    if not found:
        updated_logs.append({
            "date": target_date,
            "completed": log_in.completed,
            "notes": log_in.notes or "",
            "mood": log_in.mood,
            "logged_at": datetime.utcnow()
        })
        
    # Recalculate streak values
    current_streak, longest_streak, last_logged = calculate_streaks(updated_logs)
    longest_streak = max(longest_streak, doc.get("longest_streak", 0))
    
    updates = {
        "logs": updated_logs,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_logged_date": last_logged,
        "updated_at": datetime.utcnow()
    }
    
    await streaks_col.update_one({"_id": ObjectId(streak_id)}, {"$set": updates})
    
    updated_doc = await streaks_col.find_one({"_id": ObjectId(streak_id)})
    return await get_streak_detail(streak_id, current_user)

@router.get("/{streak_id}/logs", response_model=List[LogEntry])
async def get_streak_logs(
    streak_id: str,
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(streak_id):
        raise HTTPException(status_code=400, detail="Invalid streak ID format")
        
    streaks_col = get_streaks_collection()
    doc = await streaks_col.find_one({"_id": ObjectId(streak_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Streak not found")
        
    logs = doc.get("logs", [])
    
    # Filter by date range if provided
    if from_date:
        logs = [l for l in logs if str(l.get("date", ""))[:10] >= from_date]
    if to_date:
        logs = [l for l in logs if str(l.get("date", ""))[:10] <= to_date]
        
    sorted_logs = sorted(logs, key=lambda x: str(x.get("date", ""))[:10], reverse=True)
    return [LogEntry(**l) for l in sorted_logs[:limit]]

@router.put("/{streak_id}/logs/{log_date}", response_model=StreakDetailResponse)
async def update_past_log_entry(
    streak_id: str,
    log_date: str,
    log_in: StreakLogRequest,
    current_user: dict = Depends(get_current_user)
):
    log_in.date = log_date[:10]
    return await log_activity_entry(streak_id, log_in, current_user)
