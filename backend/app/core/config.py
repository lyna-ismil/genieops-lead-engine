from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    environment: str = "local"
    database_url: str = "sqlite:///./genieops.db"

    llm_provider: str = "gemini"
    llm_api_key: str | None = None
    llm_model: str = "gemini-1.5-flash"
    llm_temperature: float = 0.4
    llm_max_tokens: int = 2048

    email_provider: str = "none"
    email_api_key: str | None = None
    email_from: str = "no-reply@genieops.ai"
    email_from_name: str = "GenieOps"

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
