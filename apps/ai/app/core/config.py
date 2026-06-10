from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "TwinForce AI Service"
    debug: bool = False
    ai_service_api_key: str = "changeme"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/twinforce"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    qdrant_collection: str = "twinforce_knowledge"

    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4o"
    openai_embedding_model: str = "text-embedding-3-large"

    # Anthropic
    anthropic_api_key: str
    anthropic_model: str = "claude-sonnet-4-6"

    # ElevenLabs
    elevenlabs_api_key: str = ""

    # MinIO
    minio_endpoint: str = "localhost"
    minio_port: int = 9000
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "twinforce"
    minio_use_ssl: bool = False

    # Sentry
    sentry_dsn: str = ""

    class Config:
        env_file = "../../.env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
