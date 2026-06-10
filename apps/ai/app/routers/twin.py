from fastapi import APIRouter, Depends
from ..models.schemas import (
    TwinChatRequest, TwinChatResponse,
    TwinSimulateRequest, TwinSimulateResponse,
    TwinEmailDraftRequest, TwinEmailDraftResponse,
    TwinTrainRequest,
)
from ..services import twin_engine
from ..core.security import verify_api_key

router = APIRouter(prefix="/ai/twin", tags=["Twin"])


@router.post("/chat", response_model=TwinChatResponse)
async def chat(request: TwinChatRequest, _: str = Depends(verify_api_key)):
    result = await twin_engine.chat(
        twin_id=request.twin_id,
        org_id=request.org_id,
        message=request.message,
        conversation_history=[m.model_dump() for m in request.conversation_history],
    )
    return TwinChatResponse(**result)


@router.post("/simulate", response_model=TwinSimulateResponse)
async def simulate(request: TwinSimulateRequest, _: str = Depends(verify_api_key)):
    result = await twin_engine.simulate(
        twin_id=request.twin_id,
        org_id=request.org_id,
        scenario=request.scenario,
        context=request.context,
    )
    return TwinSimulateResponse(**result)


@router.post("/draft-email", response_model=TwinEmailDraftResponse)
async def draft_email(request: TwinEmailDraftRequest, _: str = Depends(verify_api_key)):
    result = await twin_engine.draft_email(
        twin_id=request.twin_id,
        org_id=request.org_id,
        thread_context=request.thread_context,
        recipient=request.recipient,
        tone=request.tone,
        subject=request.subject,
    )
    return TwinEmailDraftResponse(**result)


@router.post("/train")
async def train(request: TwinTrainRequest, _: str = Depends(verify_api_key)):
    # Training is handled asynchronously via NATS — this endpoint acknowledges receipt
    return {"status": "queued", "twin_id": request.twin_id, "org_id": request.org_id}
