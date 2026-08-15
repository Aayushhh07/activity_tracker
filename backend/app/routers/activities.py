from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query
from bson import ObjectId

from app.database import get_activities_collection, get_streaks_collection, get_users_collection
from app.models.activity import (
    ActivityCreate,
    ActivityUpdate,
    ActivityResponse,
    ActivityDetailResponse,
    ActivityParticipant
)
from app.models.common import fix_id
from app.services.auth import get_current_user, get_optional_current_user

router = APIRouter(prefix="/activities", tags=["Activities"])

async def build_activity_response(doc: dict, current_user: Optional[dict] = None) -> ActivityResponse:
    act_data = fix_id(doc)
    act_id = ObjectId(act_data["id"])
    
    users_col = get_users_collection()
    streaks_col = get_streaks_collection()
    
    # Fetch creator username if not populated
    creator_username = None
    creator_id = doc.get("creator_id")
    if creator_id:
        creator_user = await users_col.find_one({"_id": ObjectId(str(creator_id))})
        if creator_user:
            creator_username = creator_user.get("username")
            
    # Count tracking streaks
    tracking_count = await streaks_col.count_documents({"activity_id": act_id})
    
    # Check if current user is tracking
    is_tracking = False
    user_streak_id = None
    if current_user:
        user_streak = await streaks_col.find_one({
            "activity_id": act_id,
            "user_id": ObjectId(current_user["id"])
        })
        if user_streak:
            is_tracking = True
            user_streak_id = str(user_streak["_id"])
            
    return ActivityResponse(
        **act_data,
        creator_username=creator_username,
        tracking_count=tracking_count,
        is_tracking=is_tracking,
        user_streak_id=user_streak_id
    )

@router.post("", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(
    activity_in: ActivityCreate,
    current_user: dict = Depends(get_current_user)
):
    activities_col = get_activities_collection()
    streaks_col = get_streaks_collection()
    
    doc = {
        "name": activity_in.name.strip(),
        "description": activity_in.description.strip() if activity_in.description else "",
        "category": activity_in.category,
        "creator_id": ObjectId(current_user["id"]),
        "is_public": activity_in.is_public,
        "icon": activity_in.icon or "🔥",
        "color": activity_in.color or "#6366F1",
        "created_at": datetime.utcnow()
    }
    
    res = await activities_col.insert_one(doc)
    doc["_id"] = res.inserted_id
    act_id = res.inserted_id
    
    # Automatically track this new activity for the creator
    streak_doc = {
        "user_id": ObjectId(current_user["id"]),
        "activity_id": act_id,
        "current_streak": 0,
        "longest_streak": 0,
        "last_logged_date": None,
        "logs": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    streak_res = await streaks_col.insert_one(streak_doc)
    
    act_data = fix_id(doc)
    return ActivityResponse(
        **act_data,
        creator_username=current_user["username"],
        tracking_count=1,
        is_tracking=True,
        user_streak_id=str(streak_res.inserted_id)
    )

@router.get("", response_model=List[ActivityResponse])
async def list_activities(
    skip: int = 0,
    limit: int = 50,
    category: Optional[str] = None,
    q: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    activities_col = get_activities_collection()
    
    query = {}
    # Show public activities or activities created by current user
    if current_user:
        query = {
            "$or": [
                {"is_public": True},
                {"creator_id": ObjectId(current_user["id"])}
            ]
        }
    else:
        query = {"is_public": True}
        
    if category and category.strip() and category.lower() != "all":
        query["category"] = category
        
    if q and q.strip():
        query["name"] = {"$regex": q.strip(), "$options": "i"}
        
    cursor = activities_col.find(query).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        resp = await build_activity_response(doc, current_user)
        items.append(resp)
    return items

@router.get("/trending", response_model=List[ActivityResponse])
async def get_trending_activities(
    limit: int = 6,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    activities_col = get_activities_collection()
    cursor = activities_col.find({"is_public": True}).limit(30)
    all_acts = []
    async for doc in cursor:
        resp = await build_activity_response(doc, current_user)
        all_acts.append(resp)
        
    # Sort by tracking_count descending
    all_acts.sort(key=lambda x: x.tracking_count, reverse=True)
    return all_acts[:limit]

@router.get("/category/{category}", response_model=List[ActivityResponse])
async def get_activities_by_category(
    category: str,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    return await list_activities(category=category, current_user=current_user)

@router.get("/{activity_id}", response_model=ActivityDetailResponse)
async def get_activity_detail(
    activity_id: str,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID format")
        
    activities_col = get_activities_collection()
    streaks_col = get_streaks_collection()
    users_col = get_users_collection()
    
    doc = await activities_col.find_one({"_id": ObjectId(activity_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    base_resp = await build_activity_response(doc, current_user)
    
    # Get all participants tracking this activity
    streaks_cursor = streaks_col.find({"activity_id": ObjectId(activity_id)})
    streaks = await streaks_cursor.to_list(length=100)
    
    user_ids = [s["user_id"] for s in streaks]
    users_map = {}
    if user_ids:
        users_cursor = users_col.find({"_id": {"$in": user_ids}})
        async for u in users_cursor:
            users_map[str(u["_id"])] = u
            
    today_str = date.today().isoformat()
    current_user_friends = set(current_user.get("friends", [])) if current_user else set()
    
    participants = []
    total_logs = 0
    streak_sum = 0
    longest_active = 0
    
    for s in streaks:
        u_id = str(s["user_id"])
        u = users_map.get(u_id, {})
        c_streak = s.get("current_streak", 0)
        streak_sum += c_streak
        longest_active = max(longest_active, c_streak)
        
        logs = s.get("logs", [])
        total_logs += len(logs)
        completed_today = False
        today_note = None
        today_mood = None
        
        for l in logs:
            if str(l.get("date", ""))[:10] == today_str:
                completed_today = l.get("completed", False)
                if completed_today:
                    today_note = l.get("notes")
                    today_mood = l.get("mood")
                break
        
        participants.append(ActivityParticipant(
            user_id=u_id,
            username=u.get("username", "Anonymous"),
            profile_image=u.get("profile_image"),
            current_streak=c_streak,
            completed_today=completed_today,
            is_friend=(u_id in current_user_friends or ObjectId(u_id) in current_user_friends),
            today_note=today_note,
            today_mood=today_mood
        ))
        
    avg_streak = round(streak_sum / len(streaks), 1) if streaks else 0.0
    
    # Sort participants: friends first, then highest streak
    participants.sort(key=lambda p: (p.is_friend, p.current_streak), reverse=True)
    
    return ActivityDetailResponse(
        **base_resp.model_dump(),
        participants=participants,
        total_logs_count=total_logs,
        average_streak=avg_streak,
        longest_active_streak=longest_active
    )

@router.put("/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: str,
    update_in: ActivityUpdate,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID format")
        
    activities_col = get_activities_collection()
    doc = await activities_col.find_one({"_id": ObjectId(activity_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    if str(doc.get("creator_id")) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only creator can modify this activity")
        
    updates = {}
    if update_in.name is not None and update_in.name.strip():
        updates["name"] = update_in.name.strip()
    if update_in.description is not None:
        updates["description"] = update_in.description.strip()
    if update_in.category is not None:
        updates["category"] = update_in.category
    if update_in.is_public is not None:
        updates["is_public"] = update_in.is_public
    if update_in.icon is not None:
        updates["icon"] = update_in.icon
    if update_in.color is not None:
        updates["color"] = update_in.color
        
    if updates:
        await activities_col.update_one({"_id": ObjectId(activity_id)}, {"$set": updates})
        
    updated_doc = await activities_col.find_one({"_id": ObjectId(activity_id)})
    return await build_activity_response(updated_doc, current_user)

@router.delete("/{activity_id}")
async def delete_activity(
    activity_id: str,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=400, detail="Invalid activity ID format")
        
    activities_col = get_activities_collection()
    streaks_col = get_streaks_collection()
    
    doc = await activities_col.find_one({"_id": ObjectId(activity_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    if str(doc.get("creator_id")) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only creator can delete this activity")
        
    # Delete activity and all linked streaks
    await activities_col.delete_one({"_id": ObjectId(activity_id)})
    await streaks_col.delete_many({"activity_id": ObjectId(activity_id)})
    
    return {"message": "Activity and tracking streaks deleted successfully"}
