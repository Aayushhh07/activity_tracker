import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

logger = logging.getLogger("activity_tracker.db")

client: Optional[object] = None
db: Optional[object] = None
is_mock: bool = False

async def connect_to_mongo():
    global client, db, is_mock
    
    if settings.USE_MOCK_DB:
        logger.info("Using mongomock_motor as requested by configuration.")
        from mongomock_motor import AsyncMongoMockClient
        client = AsyncMongoMockClient()
        db = client[settings.DB_NAME]
        is_mock = True
        await create_indexes()
        return

    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
        real_client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=2000
        )
        # Verify connection by pinging
        await real_client.admin.command('ping')
        client = real_client
        db = client[settings.DB_NAME]
        is_mock = False
        logger.info("Successfully connected to live MongoDB!")
    except Exception as e:
        logger.warning(f"Could not connect to live MongoDB ({e}). Falling back to in-memory mongomock_motor for seamless zero-setup execution.")
        from mongomock_motor import AsyncMongoMockClient
        client = AsyncMongoMockClient()
        db = client[settings.DB_NAME]
        is_mock = True

    await create_indexes()

async def create_indexes():
    if db is None:
        return
    try:
        # Users indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        
        # Activities indexes
        await db.activities.create_index("category")
        await db.activities.create_index("creator_id")
        await db.activities.create_index("is_public")
        await db.activities.create_index("name")
        
        # Streaks indexes
        await db.streaks.create_index([("user_id", 1), ("activity_id", 1)], unique=True)
        await db.streaks.create_index("user_id")
        await db.streaks.create_index("activity_id")
        
        # Activity Messages indexes
        await db.activity_messages.create_index([("activity_id", 1), ("created_at", -1)])
        logger.info("Database indexes ensured.")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")

async def close_mongo_connection():
    global client
    if client:
        if hasattr(client, "close"):
            client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    return db

def get_users_collection():
    return db["users"]

def get_activities_collection():
    return db["activities"]

def get_streaks_collection():
    return db["streaks"]

def get_messages_collection():
    return db["activity_messages"]
