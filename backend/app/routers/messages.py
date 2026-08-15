from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId

from app.database import get_messages_collection, get_activities_collection, get_streaks_collection
from app.models.message import MessageCreate, MessageResponse
from app.models.common import fix_id
from app.services.auth import get_current_user

router = APIRouter(prefix="/activities", tags=["Activity Messages"])

@router.get("/{activity_id}/messages", response_model=List[MessageResponse])
async def get_activity_messages(
    activity_id: str,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid activity ID format")
        
    activities_col = get_activities_collection()
    act = await activities_col.find_one({"_id": ObjectId(activity_id)})
    if not act:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        
    # Optional security: Only allow viewing messages if the activity is public OR if the user is the creator or participant
    streaks_col = get_streaks_collection()
    is_tracking = await streaks_col.find_one({
        "activity_id": ObjectId(activity_id),
        "user_id": ObjectId(current_user["id"])
    })
    
    if not act.get("is_public") and not is_tracking and str(act.get("creator_id")) != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view messages for this private activity")
        
    messages_col = get_messages_collection()
    cursor = messages_col.find({"activity_id": ObjectId(activity_id)}).sort("created_at", 1).limit(100)
    
    messages = []
    async for doc in cursor:
        messages.append(MessageResponse(**fix_id(doc)))
    return messages

@router.post("/{activity_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def post_activity_message(
    activity_id: str,
    msg_in: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid activity ID format")
        
    activities_col = get_activities_collection()
    act = await activities_col.find_one({"_id": ObjectId(activity_id)})
    if not act:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        
    # Validate participant: only users tracking this activity can post messages on the board
    streaks_col = get_streaks_collection()
    is_tracking = await streaks_col.find_one({
        "activity_id": ObjectId(activity_id),
        "user_id": ObjectId(current_user["id"])
    })
    
    if not is_tracking:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must join/track this activity to write messages on its board"
        )
        
    messages_col = get_messages_collection()
    doc = {
        "activity_id": ObjectId(activity_id),
        "user_id": ObjectId(current_user["id"]),
        "username": current_user["username"],
        "profile_image": current_user.get("profile_image"),
        "message": msg_in.message.strip(),
        "created_at": datetime.utcnow()
    }
    
    res = await messages_col.insert_one(doc)
    doc["_id"] = res.inserted_id
    return MessageResponse(**fix_id(doc))
