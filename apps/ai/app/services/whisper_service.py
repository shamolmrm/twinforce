"""
Whisper transcription service with support for local Whisper and OpenAI API.
"""
import io
from ..core.deps import get_openai_client
import structlog

logger = structlog.get_logger()


async def transcribe(audio_bytes: bytes, filename: str = "audio.mp3", language: str | None = None) -> str:
    client = get_openai_client()

    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename

    kwargs: dict = {"model": "whisper-1", "file": audio_file}
    if language:
        kwargs["language"] = language

    response = await client.audio.transcriptions.create(**kwargs)
    return response.text
