from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..core.security import verify_api_key
from ..core.deps import get_openai_client
from ..core.config import get_settings
import json

router = APIRouter(prefix="/ai/email", tags=["Email Intelligence"])


class EmailClassifyRequest(BaseModel):
    subject: str
    body: str
    sender: str


class EmailClassifyResponse(BaseModel):
    category: str
    sentiment: str
    priority: str
    summary: str
    suggested_response: str | None = None


@router.post("/classify", response_model=EmailClassifyResponse)
async def classify_email(request: EmailClassifyRequest, _: str = Depends(verify_api_key)):
    client = get_openai_client()
    settings = get_settings()

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": """Classify this email and return JSON with:
- category: (sales/support/internal/marketing/legal/finance/hr/other)
- sentiment: (positive/neutral/negative/urgent)
- priority: (high/medium/low)
- summary: one-sentence summary
- suggested_response: brief suggested reply if action needed, null otherwise""",
            },
            {
                "role": "user",
                "content": f"From: {request.sender}\nSubject: {request.subject}\n\n{request.body[:3000]}",
            },
        ],
        temperature=0.2,
        max_tokens=500,
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content or "{}")
    return EmailClassifyResponse(**data)
