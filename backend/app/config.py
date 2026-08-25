# backend/app/config.py
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ensure .env is located from project backend root
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    GROQ_API_KEY: str
    GEMINI_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    DATABASE_URL: str
    PORT: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
