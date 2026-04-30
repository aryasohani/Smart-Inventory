from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "SmartStore AI"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Database
    DATABASE_URL: str   # ✅ ONLY this (no value)
    SYNC_DATABASE_URL: str = "sqlite:///./smartstore.db"

    # Security
    SECRET_KEY: str = "dev-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    AI_PROVIDER: str = "openai"

    # OCR
    TESSERACT_CMD: str = "/usr/bin/tesseract"
    USE_VISION_LLM: bool = False

    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()


def get_cors_origins() -> List[str]:
    return [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]