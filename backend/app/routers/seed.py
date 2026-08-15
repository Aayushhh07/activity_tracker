from datetime import datetime, date, timedelta
from fastapi import APIRouter
from bson import ObjectId

from app.database import get_users_collection, get_activities_collection, get_streaks_collection
from app.services.auth import get_password_hash
from app.services.streak_calculator import calculate_streaks

router = APIRouter(prefix="/seed", tags=["Seed"])

@router.post("")
async def seed_database():
    users_col = get_users_collection()
    activities_col = get_activities_collection()
    streaks_col = get_streaks_collection()
    
    # Check if demo user already exists
    existing = await users_col.find_one({"email": "demo@example.com"})
    if existing:
        return {"message": "Database already seeded", "demo_email": "demo@example.com", "password": "password123"}
        
    pwd_hash = get_password_hash("password123")
    today = date.today()
    
    # 1. Create Users
    users_data = [
        {
            "username": "demo_user",
            "email": "demo@example.com",
            "password_hash": pwd_hash,
            "profile_image": "https://api.dicebear.com/7.x/bottts/svg?seed=demo_user",
            "bio": "Building daily healthy habits one day at a time! 🚀",
            "created_at": datetime.utcnow() - timedelta(days=60),
            "friends": []
        },
        {
            "username": "alex_runner",
            "email": "alex@example.com",
            "password_hash": pwd_hash,
            "profile_image": "https://api.dicebear.com/7.x/bottts/svg?seed=alex_runner",
            "bio": "Marathon enthusiast & daily runner 🏃‍♂️",
            "created_at": datetime.utcnow() - timedelta(days=90),
            "friends": []
        },
        {
            "username": "sarah_code",
            "email": "sarah@example.com",
            "password_hash": pwd_hash,
            "profile_image": "https://api.dicebear.com/7.x/bottts/svg?seed=sarah_code",
            "bio": "Software engineer learning Rust and AI 💻",
            "created_at": datetime.utcnow() - timedelta(days=45),
            "friends": []
        },
        {
            "username": "zen_maya",
            "email": "maya@example.com",
            "password_hash": pwd_hash,
            "profile_image": "https://api.dicebear.com/7.x/bottts/svg?seed=zen_maya",
            "bio": "Mindfulness, tea, yoga & meditation 🧘‍♀️",
            "created_at": datetime.utcnow() - timedelta(days=30),
            "friends": []
        }
    ]
    
    inserted_users = {}
    for u in users_data:
        res = await users_col.insert_one(u)
        inserted_users[u["username"]] = res.inserted_id
        
    demo_id = inserted_users["demo_user"]
    alex_id = inserted_users["alex_runner"]
    sarah_id = inserted_users["sarah_code"]
    maya_id = inserted_users["zen_maya"]
    
    # Establish reciprocal friendships with demo_user
    await users_col.update_one({"_id": demo_id}, {"$set": {"friends": [alex_id, sarah_id, maya_id]}})
    await users_col.update_one({"_id": alex_id}, {"$set": {"friends": [demo_id, sarah_id]}})
    await users_col.update_one({"_id": sarah_id}, {"$set": {"friends": [demo_id, alex_id, maya_id]}})
    await users_col.update_one({"_id": maya_id}, {"$set": {"friends": [demo_id, sarah_id]}})
    
    # 2. Create Activities
    activities_data = [
        {
            "name": "Morning 5km Run",
            "description": "Start the day energized with a fresh outdoor or treadmill run.",
            "category": "Health & Fitness",
            "creator_id": alex_id,
            "is_public": True,
            "icon": "🏃",
            "color": "#10B981", # Emerald
            "created_at": datetime.utcnow() - timedelta(days=40)
        },
        {
            "name": "Read 20 Pages",
            "description": "Read at least 20 pages of non-fiction, fiction, or technical books daily.",
            "category": "Learning & Education",
            "creator_id": demo_id,
            "is_public": True,
            "icon": "📚",
            "color": "#6366F1", # Indigo
            "created_at": datetime.utcnow() - timedelta(days=35)
        },
        {
            "name": "15min Daily Meditation",
            "description": "Mindful breathwork and quiet meditation for mental clarity.",
            "category": "Mindfulness & Wellness",
            "creator_id": maya_id,
            "is_public": True,
            "icon": "🧘",
            "color": "#8B5CF6", # Purple
            "created_at": datetime.utcnow() - timedelta(days=30)
        },
        {
            "name": "Solve 1 Coding Challenge",
            "description": "Keep problem-solving sharp with one LeetCode, HackerRank, or project bug fix.",
            "category": "Productivity",
            "creator_id": sarah_id,
            "is_public": True,
            "icon": "💻",
            "color": "#3B82F6", # Blue
            "created_at": datetime.utcnow() - timedelta(days=25)
        },
        {
            "name": "Drink 2.5L Water",
            "description": "Stay hydrated throughout the workday for peak focus.",
            "category": "Health & Fitness",
            "creator_id": demo_id,
            "is_public": True,
            "icon": "💧",
            "color": "#06B6D4", # Cyan
            "created_at": datetime.utcnow() - timedelta(days=20)
        },
        {
            "name": "Creative Sketching",
            "description": "Draw, design, or brainstorm something visual for 15 minutes.",
            "category": "Creative & Hobbies",
            "creator_id": demo_id,
            "is_public": True,
            "icon": "🎨",
            "color": "#EC4899", # Pink
            "created_at": datetime.utcnow() - timedelta(days=15)
        }
    ]
    
    inserted_acts = []
    for a in activities_data:
        res = await activities_col.insert_one(a)
        inserted_acts.append((a, res.inserted_id))
        
    # 3. Helper to create streak logs
    def make_logs(days_ago_start: int, streak_length: int, include_today: bool, notes_mood_list=None):
        logs = []
        for i in range(days_ago_start, -1, -1):
            d = today - timedelta(days=i)
            # determine if completed
            if i == 0:
                comp = include_today
            elif i <= streak_length:
                comp = True
            else:
                comp = (i % 3 != 0) # occasional past logs
                
            mood = "great" if comp and i % 2 == 0 else ("good" if comp else "okay")
            note = f"Felt great keeping the momentum on day {days_ago_start - i + 1}!" if comp and i % 3 == 0 else ""
            
            logs.append({
                "date": d.isoformat(),
                "completed": comp,
                "notes": note,
                "mood": mood,
                "logged_at": datetime.utcnow() - timedelta(days=i, hours=2)
            })
        return logs

    # 4. Create Streaks for Demo User
    # Streak 1: Read 20 Pages (12-day streak, completed today)
    logs_read = make_logs(18, 12, include_today=True)
    c_s, l_s, last_d = calculate_streaks(logs_read)
    await streaks_col.insert_one({
        "user_id": demo_id,
        "activity_id": inserted_acts[1][1], # Read 20 Pages
        "current_streak": c_s,
        "longest_streak": max(l_s, 14),
        "last_logged_date": today.isoformat(),
        "logs": logs_read,
        "created_at": datetime.utcnow() - timedelta(days=25),
        "updated_at": datetime.utcnow()
    })
    
    # Streak 2: Morning 5km Run (5-day streak, not yet completed today)
    logs_run = make_logs(10, 5, include_today=False)
    c_s, l_s, last_d = calculate_streaks(logs_run)
    await streaks_col.insert_one({
        "user_id": demo_id,
        "activity_id": inserted_acts[0][1], # Morning Run
        "current_streak": c_s,
        "longest_streak": max(l_s, 8),
        "last_logged_date": (today - timedelta(days=1)).isoformat(),
        "logs": logs_run,
        "created_at": datetime.utcnow() - timedelta(days=15),
        "updated_at": datetime.utcnow()
    })
    
    # Streak 3: Drink 2.5L Water (8-day streak, completed today)
    logs_water = make_logs(12, 8, include_today=True)
    c_s, l_s, last_d = calculate_streaks(logs_water)
    await streaks_col.insert_one({
        "user_id": demo_id,
        "activity_id": inserted_acts[4][1], # Drink Water
        "current_streak": c_s,
        "longest_streak": max(l_s, 10),
        "last_logged_date": today.isoformat(),
        "logs": logs_water,
        "created_at": datetime.utcnow() - timedelta(days=20),
        "updated_at": datetime.utcnow()
    })
    
    # 5. Create Streaks for Alex (Runner)
    logs_alex_run = make_logs(30, 24, include_today=True)
    c_s, l_s, _ = calculate_streaks(logs_alex_run)
    await streaks_col.insert_one({
        "user_id": alex_id,
        "activity_id": inserted_acts[0][1],
        "current_streak": c_s,
        "longest_streak": l_s,
        "last_logged_date": today.isoformat(),
        "logs": logs_alex_run,
        "created_at": datetime.utcnow() - timedelta(days=35),
        "updated_at": datetime.utcnow()
    })
    
    # 6. Create Streaks for Sarah (Code)
    logs_sarah_code = make_logs(20, 15, include_today=True)
    c_s, l_s, _ = calculate_streaks(logs_sarah_code)
    await streaks_col.insert_one({
        "user_id": sarah_id,
        "activity_id": inserted_acts[3][1],
        "current_streak": c_s,
        "longest_streak": l_s,
        "last_logged_date": today.isoformat(),
        "logs": logs_sarah_code,
        "created_at": datetime.utcnow() - timedelta(days=22),
        "updated_at": datetime.utcnow()
    })
    
    # 7. Create Streaks for Maya (Meditation)
    logs_maya_med = make_logs(15, 9, include_today=True)
    c_s, l_s, _ = calculate_streaks(logs_maya_med)
    await streaks_col.insert_one({
        "user_id": maya_id,
        "activity_id": inserted_acts[2][1],
        "current_streak": c_s,
        "longest_streak": l_s,
        "last_logged_date": today.isoformat(),
        "logs": logs_maya_med,
        "created_at": datetime.utcnow() - timedelta(days=16),
        "updated_at": datetime.utcnow()
    })
    
    return {
        "message": "Database seeded successfully with demo users, activities, and rich streaks history!",
        "demo_login": {
            "email": "demo@example.com",
            "password": "password123"
        }
    }
