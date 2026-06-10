from fastapi import APIRouter, Depends
from ..models.schemas import EmbedRequest, EmbedResponse
from ..services.embedding_service import get_embeddings
from ..core.security import verify_api_key
from ..core.config import get_settings

router = APIRouter(prefix="/ai/embeddings", tags=["Embeddings"])


@router.post("/", response_model=EmbedResponse)
async def embed(request: EmbedRequest, _: str = Depends(verify_api_key)):
    settings = get_settings()
    model = request.model or settings.openai_embedding_model
    embeddings = await get_embeddings(request.texts, model)
    return EmbedResponse(
        embeddings=embeddings,
        model=model,
        usage={"prompt_tokens": sum(len(t.split()) for t in request.texts), "total_tokens": sum(len(t.split()) for t in request.texts)},
    )
