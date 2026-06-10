import asyncio
from ..core.deps import get_openai_client
from ..core.config import get_settings


async def get_embeddings(texts: list[str], model: str | None = None) -> list[list[float]]:
    client = get_openai_client()
    settings = get_settings()
    model = model or settings.openai_embedding_model

    # Batch in groups of 100 to stay within API limits
    all_embeddings: list[list[float]] = []
    batch_size = 100
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        response = await client.embeddings.create(model=model, input=batch)
        all_embeddings.extend([item.embedding for item in response.data])

    return all_embeddings


async def get_single_embedding(text: str) -> list[float]:
    embeddings = await get_embeddings([text])
    return embeddings[0]
