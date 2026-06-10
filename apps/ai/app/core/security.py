from fastapi import HTTPException, Security, Header
from fastapi.security import APIKeyHeader
from .config import get_settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(x_api_key: str | None = Security(api_key_header)) -> str:
    settings = get_settings()
    if not x_api_key or x_api_key != settings.ai_service_api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return x_api_key
