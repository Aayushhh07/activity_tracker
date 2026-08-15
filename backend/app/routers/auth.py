from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId

from app.database import get_users_collection
from app.models.user import UserCreate, UserLogin, UserResponse, Token
from app.models.common import fix_id
from app.services.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    users_col = get_users_collection()
    
    # Check if email or username already exists
    existing_user = await users_col.find_one({
        "$or": [
            {"email": user_in.email.lower()},
            {"username": user_in.username.lower()}
        ]
    })
    if existing_user:
        if existing_user.get("email") == user_in.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists"
        )
    
    # Default avatar if not provided
    avatar = user_in.profile_image or f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.username}"
    
    user_doc = {
        "username": user_in.username,
        "email": user_in.email.lower(),
        "password_hash": get_password_hash(user_in.password),
        "created_at": datetime.utcnow(),
        "profile_image": avatar,
        "bio": user_in.bio or "Ready to build amazing daily habits!",
        "friends": []
    }
    
    result = await users_col.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    user_data = fix_id(user_doc)
    
    token = create_access_token({"sub": user_data["id"], "username": user_data["username"]})
    return Token(access_token=token, token_type="bearer", user=UserResponse(**user_data))

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    users_col = get_users_collection()
    
    login_id = credentials.email.strip().lower()
    user = await users_col.find_one({
        "$or": [
            {"email": login_id},
            {"username": {"$regex": f"^{credentials.email.strip()}$", "$options": "i"}}
        ]
    })
    
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_data = fix_id(user)
    token = create_access_token({"sub": user_data["id"], "username": user_data["username"]})
    return Token(access_token=token, token_type="bearer", user=UserResponse(**user_data))

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: dict = Depends(get_current_user)):
    token = create_access_token({"sub": current_user["id"], "username": current_user["username"]})
    return Token(access_token=token, token_type="bearer", user=UserResponse(**current_user))

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)
