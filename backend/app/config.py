import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Activity Streak Tracker API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "activity_tracker")
    USE_MOCK_DB: bool = os.getenv("USE_MOCK_DB", "false").lower() in ("true", "1", "yes")
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-jwt-activity-tracker-secret-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Comma-separated or wildcard CORS origins
    CORS_ORIGINS_RAW: str = os.getenv("CORS_ORIGINS", "*")
    
    @property
    def cors_origins_list(self) -> list[str]:
        if self.CORS_ORIGINS_RAW == "*" or not self.CORS_ORIGINS_RAW:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
