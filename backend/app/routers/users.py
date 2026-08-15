from datetime import date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query
from bson import ObjectId

from app.database import get_users_collection, get_streaks_collection
from app.models.user import UserProfile, UserUpdate, FriendStatus, UserResponse
from app.models.common import fix_id
from app.services.auth import get_current_user, get_optional_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/search", response_model=List[UserResponse])
async def search_users(
    q: str = Query(..., min_length=1),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    users_col = get_users_collection()
    query = {"username": {"$regex": q, "$options": "i"}}
    
    cursor = users_col.find(query).limit(20)
    users = []
    async for doc in cursor:
        user_data = fix_id(doc)
        if current_user and user_data["id"] == current_user["id"]:
            continue
        users.append(UserResponse(**user_data))
    return users

@router.get("/{user_id}", response_model=UserProfile)
async def get_user_profile(
    user_id: str,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
        
    users_col = get_users_collection()
    streaks_col = get_streaks_collection()
    
    user = await users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = fix_id(user)
    
    # Calculate aggregate stats from user's streaks
    streaks_cursor = streaks_col.find({"user_id": ObjectId(user_id)})
    streaks = await streaks_cursor.to_list(length=100)
    
    total_streaks = len(streaks)
    active_streaks = sum(1 for s in streaks if s.get("current_streak", 0) > 0)
    longest_streak = max((s.get("longest_streak", 0) for s in streaks), default=0)
    
    total_completions = 0
    for s in streaks:
        logs = s.get("logs", [])
        total_completions += sum(1 for l in logs if l.get("completed", False))
        
    is_friend = False
    if current_user:
        current_friends = current_user.get("friends", [])
        is_friend = (user_id in [str(f) for f in current_friends])
        
    return UserProfile(
        **user_data,
        total_streaks_tracked=total_streaks,
        total_completions=total_completions,
        longest_streak_ever=longest_streak,
        active_streaks_count=active_streaks,
        is_friend=is_friend
    )

@router.put("/{user_id}", response_model=UserResponse)
async def update_user_profile(
    user_id: str,
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Cannot edit another user's profile")
        
    users_col = get_users_collection()
    updates = {}
    
    if update_data.username is not None and update_data.username.strip():
        # Check if taken
        existing = await users_col.find_one({
            "username": update_data.username.strip(),
            "_id": {"$ne": ObjectId(user_id)}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        updates["username"] = update_data.username.strip()
        
    if update_data.bio is not None:
        updates["bio"] = update_data.bio
        
    if update_data.profile_image is not None:
        updates["profile_image"] = update_data.profile_image
        
    if updates:
        await users_col.update_one({"_id": ObjectId(user_id)}, {"$set": updates})
        
    updated_user = await users_col.find_one({"_id": ObjectId(user_id)})
    return UserResponse(**fix_id(updated_user))

@router.post("/{user_id}/friends", response_model=UserResponse)
async def add_friend(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    if current_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="You cannot add yourself as a friend")
        
    users_col = get_users_collection()
    target_user = await users_col.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Add friend to current user
    await users_col.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$addToSet": {"friends": ObjectId(user_id)}}
    )
    # Also add current user to target user for reciprocal connection
    await users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"friends": ObjectId(current_user["id"])}}
    )
    
    updated_current = await users_col.find_one({"_id": ObjectId(current_user["id"])})
    return UserResponse(**fix_id(updated_current))

@router.delete("/{user_id}/friends", response_model=UserResponse)
async def remove_friend(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
        
    users_col = get_users_collection()
    await users_col.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$pull": {"friends": ObjectId(user_id)}}
    )
    await users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"friends": ObjectId(current_user["id"])}}
    )
    
    updated_current = await users_col.find_one({"_id": ObjectId(current_user["id"])})
    return UserResponse(**fix_id(updated_current))

@router.get("/{user_id}/friends", response_model=List[FriendStatus])
async def get_user_friends(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
        
    users_col = get_users_collection()
    streaks_col = get_streaks_collection()
    
    user = await users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    friend_ids = user.get("friends", [])
    if not friend_ids:
        return []
        
    friends_cursor = users_col.find({"_id": {"$in": friend_ids}})
    friends = await friends_cursor.to_list(length=100)
    
    today_str = date.today().isoformat()
    result = []
    
    for f in friends:
        f_id = f["_id"]
        # Find streaks for this friend
        f_streaks = await streaks_col.find({"user_id": f_id}).to_list(length=100)
        
        active_count = sum(1 for s in f_streaks if s.get("current_streak", 0) > 0)
        completed_today = 0
        
        for s in f_streaks:
            logs = s.get("logs", [])
            for l in logs:
                if str(l.get("date", ""))[:10] == today_str and l.get("completed", False):
                    completed_today += 1
                    break
                    
        result.append(FriendStatus(
            id=str(f["_id"]),
            username=f.get("username", "Unknown"),
            profile_image=f.get("profile_image"),
            bio=f.get("bio"),
            active_streaks_count=active_count,
            completed_today_count=completed_today,
            total_today_activities=len(f_streaks)
        ))
        
    return result
