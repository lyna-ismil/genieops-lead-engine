from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


_ENV_FILE = str(Path(__file__).resolve().parents[2] / ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: str = "local"
    database_url: str = "sqlite:///./genieops.db"

    llm_provider: str = "openai"
    llm_api_key: str | None = None
    llm_model: str = "gpt-4o-mini"
    llm_temperature: float = 0.4
    llm_max_tokens: int = 2048

    email_provider: str = "none"
    email_api_key: str | None = None
    email_from: str = "no-reply@genieops.ai"
    email_from_name: str = "GenieOps"

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    linkedin_client_id: str | None = None
    linkedin_client_secret: str | None = None
    linkedin_redirect_uri: str | None = None

    unsplash_access_key: str | None = None

    jwt_secret: str = "dev-secret-change"
    jwt_expires_minutes: int = 60 * 24


@lru_cache
def get_settings() -> Settings:
    return Settings()
