from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "SmartStore AI"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # CORS (loaded from .env as comma-separated string)
    CORS_ORIGINS: str

    # Database
    DATABASE_URL: str
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
    """
    Convert comma-separated env string into clean list
    """
    if not settings.CORS_ORIGINS:
        return []

    return [
        origin.strip()
        for origin in settings.CORS_ORIGINS.split(",")
        if origin.strip()
    ]