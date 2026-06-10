from fastapi import APIRouter, Depends
from ..models.schemas import (
    RAGIngestRequest, RAGSearchRequest, RAGSearchResponse,
    RAGAskRequest, RAGAskResponse, RAGSearchResult,
)
from ..services import rag_engine
from ..core.security import verify_api_key

router = APIRouter(prefix="/ai/rag", tags=["RAG"])


@router.post("/ingest")
async def ingest(request: RAGIngestRequest, _: str = Depends(verify_api_key)):
    await rag_engine.ensure_collection()
    return {"status": "queued", "source_id": request.source_id, "organization_id": request.organization_id}


@router.post("/search", response_model=RAGSearchResponse)
async def search(request: RAGSearchRequest, _: str = Depends(verify_api_key)):
    chunks = await rag_engine.search(
        query=request.query,
        org_id=request.organization_id,
        top_k=request.top_k,
        filters=request.filters,
    )
    results = [
        RAGSearchResult(
            content=c["content"],
            score=c["score"],
            source=c.get("source", ""),
            document_id=c["document_id"],
            chunk_index=c["chunk_index"],
        )
        for c in chunks
    ]
    return RAGSearchResponse(chunks=results, total=len(results))


@router.post("/ask", response_model=RAGAskResponse)
async def ask(request: RAGAskRequest, _: str = Depends(verify_api_key)):
    result = await rag_engine.answer_question(
        question=request.question,
        org_id=request.organization_id,
        twin_id=request.twin_id,
    )
    return RAGAskResponse(**result)
