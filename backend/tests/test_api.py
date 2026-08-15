import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import connect_to_mongo, close_mongo_connection
from app.routers.seed import seed_database

async def run_tests():
    print("[*] Starting automated backend tests...")
    
    # Initialize DB connection and seed
    await connect_to_mongo()
    await seed_database()
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/api/health")
        assert res.status_code == 200, f"Health failed: {res.text}"
        print("[+] Health check passed")
        
        # 2. Login with seeded user
        login_res = await client.post("/api/auth/login", json={
            "email": "demo@example.com",
            "password": "password123"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token_data = login_res.json()
        token = token_data["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}
        print(f"[+] Demo Login successful, user: {token_data['user']['username']}")
        
        # 3. Get /api/auth/me
        me_res = await client.get("/api/auth/me", headers=auth_headers)
        assert me_res.status_code == 200, f"Auth me failed: {me_res.text}"
        print(f"[+] /api/auth/me verified: {me_res.json()['email']}")
        
        # 4. Get Public Activities
        act_res = await client.get("/api/activities", headers=auth_headers)
        assert act_res.status_code == 200, f"Activities list failed: {act_res.text}"
        acts = act_res.json()
        assert len(acts) > 0, "No activities returned"
        print(f"[+] /api/activities verified ({len(acts)} activities loaded)")
        
        # 5. Create new Activity
        new_act_res = await client.post("/api/activities", headers=auth_headers, json={
            "name": "Evening Yoga Flow",
            "description": "20 minutes of gentle yoga stretching",
            "category": "Mindfulness & Wellness",
            "icon": "YOGA",
            "color": "#8B5CF6",
            "is_public": True
        })
        assert new_act_res.status_code == 201, f"Create activity failed: {new_act_res.text}"
        created_act = new_act_res.json()
        print(f"[+] Activity created: {created_act['name']} (ID: {created_act['id']})")
        
        # 6. Check User Streaks
        streaks_res = await client.get("/api/streaks", headers=auth_headers)
        assert streaks_res.status_code == 200, f"Get streaks failed: {streaks_res.text}"
        streaks = streaks_res.json()
        print(f"[+] /api/streaks verified ({len(streaks)} streaks tracked)")
        
        # 7. Log Activity Daily Entry
        streak_to_log = streaks[0]
        streak_id = streak_to_log["id"]
        log_res = await client.post(f"/api/streaks/{streak_id}/log", headers=auth_headers, json={
            "completed": True,
            "notes": "Completed effortlessly today!",
            "mood": "great"
        })
        assert log_res.status_code == 200, f"Logging failed: {log_res.text}"
        updated_streak = log_res.json()
        print(f"[+] Activity logged! Current streak: {updated_streak['current_streak']}, Longest: {updated_streak['longest_streak']}")
        
        # 8. Get Streak Details & Stats
        detail_res = await client.get(f"/api/streaks/{streak_id}", headers=auth_headers)
        assert detail_res.status_code == 200, f"Detail failed: {detail_res.text}"
        detail_data = detail_res.json()
        assert "stats" in detail_data and "logs" in detail_data
        print(f"[+] Streak details verified: consistency {detail_data['stats']['consistency_percentage']}%")
        
        # 9. Dashboard endpoints
        dash_today = await client.get("/api/dashboard/today", headers=auth_headers)
        assert dash_today.status_code == 200, f"Dash today failed: {dash_today.text}"
        print(f"[+] /api/dashboard/today verified ({len(dash_today.json())} items)")
        
        dash_summary = await client.get("/api/dashboard/summary", headers=auth_headers)
        assert dash_summary.status_code == 200, f"Dash summary failed: {dash_summary.text}"
        print(f"[+] /api/dashboard/summary verified (completions: {dash_summary.json()['total_completions_all_time']})")
        
        dash_friends = await client.get("/api/dashboard/friends", headers=auth_headers)
        assert dash_friends.status_code == 200, f"Dash friends failed: {dash_friends.text}"
        print(f"[+] /api/dashboard/friends verified ({len(dash_friends.json())} friend feed items)")
        
        # 10. Users search & Friends list
        search_res = await client.get("/api/users/search?q=alex", headers=auth_headers)
        assert search_res.status_code == 200, f"User search failed: {search_res.text}"
        print(f"[+] User search verified: found {len(search_res.json())} matching users")
        
        friends_res = await client.get(f"/api/users/{token_data['user']['id']}/friends", headers=auth_headers)
        assert friends_res.status_code == 200, f"Friends list failed: {friends_res.text}"
        print(f"[+] Friends list verified: {len(friends_res.json())} friends")

        # 11. Activity Message Board (Shared Notes)
        post_msg_res = await client.post(
            f"/api/activities/{streak_to_log['activity_id']}/messages",
            headers=auth_headers,
            json={"message": "Hey team, just completed my day! Let's keep it up!"}
        )
        assert post_msg_res.status_code == 201, f"Post message failed: {post_msg_res.text}"
        print("[+] Activity message board post verified")

        get_msgs_res = await client.get(
            f"/api/activities/{streak_to_log['activity_id']}/messages",
            headers=auth_headers
        )
        assert get_msgs_res.status_code == 200, f"Get messages failed: {get_msgs_res.text}"
        msgs = get_msgs_res.json()
        assert len(msgs) > 0
        assert msgs[0]["message"] == "Hey team, just completed my day! Let's keep it up!"
        print(f"[+] Activity message board fetch verified ({len(msgs)} message loaded)")

    await close_mongo_connection()
    print("\n[SUCCESS] ALL BACKEND TESTS PASSED SUCCESSFULLY!\n")

if __name__ == "__main__":
    asyncio.run(run_tests())
