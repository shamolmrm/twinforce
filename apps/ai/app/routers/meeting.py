from fastapi import APIRouter, Depends
from ..models.schemas import (
    MeetingTranscribeRequest, MeetingTranscribeResponse,
    MeetingSummarizeRequest, MeetingSummarizeResponse,
    MeetingExtractActionsRequest, MeetingExtractActionsResponse,
)
from ..services import meeting_intel
from ..core.security import verify_api_key

router = APIRouter(prefix="/ai/meeting", tags=["Meeting"])


@router.post("/transcribe", response_model=MeetingTranscribeResponse)
async def transcribe(request: MeetingTranscribeRequest, _: str = Depends(verify_api_key)):
    result = await meeting_intel.transcribe_audio(
        audio_url=request.audio_url,
        meeting_id=request.meeting_id,
    )
    return MeetingTranscribeResponse(**result)


@router.post("/summarize", response_model=MeetingSummarizeResponse)
async def summarize(request: MeetingSummarizeRequest, _: str = Depends(verify_api_key)):
    result = await meeting_intel.summarize_meeting(
        transcript=request.transcript,
        participants=request.participants,
        meeting_id=request.meeting_id,
    )
    return MeetingSummarizeResponse(**result)


@router.post("/extract-actions", response_model=MeetingExtractActionsResponse)
async def extract_actions(request: MeetingExtractActionsRequest, _: str = Depends(verify_api_key)):
    result = await meeting_intel.extract_action_items(
        transcript=request.transcript,
        participants=request.participants,
    )
    return MeetingExtractActionsResponse(**result)


@router.post("/generate-followup")
async def generate_followup(
    meeting_id: str,
    summary: str,
    action_items: list[dict],
    _: str = Depends(verify_api_key),
):
    result = await meeting_intel.generate_followup_email(meeting_id, summary, action_items)
    return result
