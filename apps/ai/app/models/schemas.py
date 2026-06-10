from pydantic import BaseModel, Field
from typing import Any


# ─── Twin ───────────────────────────────────────────────────────────────────
class ConversationMessage(BaseModel):
    role: str
    content: str


class TwinChatRequest(BaseModel):
    twin_id: str
    org_id: str
    message: str
    conversation_history: list[ConversationMessage] = []


class TwinChatResponse(BaseModel):
    response: str
    confidence_score: float
    sources: list[str] = []
    reasoning: str | None = None


class TwinSimulateRequest(BaseModel):
    twin_id: str
    org_id: str
    scenario: str
    context: dict[str, Any] = {}


class TwinSimulateResponse(BaseModel):
    simulated_response: str
    reasoning: str
    confidence_score: float


class TwinEmailDraftRequest(BaseModel):
    twin_id: str
    org_id: str
    thread_context: str
    recipient: str
    tone: str = "professional"
    subject: str | None = None


class TwinEmailDraftResponse(BaseModel):
    subject: str
    body: str
    confidence_score: float


class TwinTrainRequest(BaseModel):
    twin_id: str
    org_id: str
    data_sources: list[dict[str, Any]] = []


# ─── RAG ────────────────────────────────────────────────────────────────────
class RAGIngestRequest(BaseModel):
    source_type: str
    source_config: dict[str, Any]
    organization_id: str
    source_id: str


class RAGSearchRequest(BaseModel):
    query: str
    organization_id: str
    filters: dict[str, Any] = {}
    top_k: int = Field(default=10, ge=1, le=50)


class RAGSearchResult(BaseModel):
    content: str
    score: float
    source: str
    document_id: str
    chunk_index: int


class RAGSearchResponse(BaseModel):
    chunks: list[RAGSearchResult]
    total: int


class RAGAskRequest(BaseModel):
    question: str
    organization_id: str
    twin_id: str | None = None


class RAGAskResponse(BaseModel):
    answer: str
    sources: list[str]
    confidence: float


# ─── Meeting ─────────────────────────────────────────────────────────────────
class MeetingTranscribeRequest(BaseModel):
    audio_url: str
    meeting_id: str


class MeetingTranscribeResponse(BaseModel):
    transcript: str
    speaker_segments: list[dict[str, Any]]


class MeetingSummarizeRequest(BaseModel):
    transcript: str
    participants: list[str]
    meeting_id: str


class MeetingSummarizeResponse(BaseModel):
    summary: str
    key_points: list[str]
    decisions: list[str]
    sentiment_score: float


class MeetingExtractActionsRequest(BaseModel):
    transcript: str
    participants: list[str]


class ActionItem(BaseModel):
    title: str
    description: str
    assignee: str | None = None
    due_date: str | None = None
    priority: str = "medium"


class MeetingExtractActionsResponse(BaseModel):
    action_items: list[ActionItem]


# ─── Embeddings ──────────────────────────────────────────────────────────────
class EmbedRequest(BaseModel):
    texts: list[str]
    model: str = "text-embedding-3-large"


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]
    model: str
    usage: dict[str, int]
