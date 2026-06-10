"""
Meeting Intelligence — transcription, summarization, action item extraction.
Uses OpenAI Whisper for transcription and GPT-4o for analysis.
"""
import json
import httpx
from ..core.deps import get_openai_client
from ..core.config import get_settings
import structlog

logger = structlog.get_logger()


async def transcribe_audio(audio_url: str, meeting_id: str) -> dict:
    settings = get_settings()
    client = get_openai_client()

    # Download audio file
    async with httpx.AsyncClient(timeout=120) as http:
        response = await http.get(audio_url)
        response.raise_for_status()
        audio_bytes = response.content

    # Transcribe with Whisper
    import io
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = f"{meeting_id}.mp3"

    transcript_response = await client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        response_format="verbose_json",
        timestamp_granularities=["segment"],
    )

    segments = []
    if hasattr(transcript_response, "segments") and transcript_response.segments:
        for seg in transcript_response.segments:
            segments.append({
                "start": seg.start,
                "end": seg.end,
                "text": seg.text.strip(),
                "speaker": "Unknown",  # Diarization would require additional processing
            })

    return {
        "transcript": transcript_response.text,
        "speaker_segments": segments,
    }


async def summarize_meeting(transcript: str, participants: list[str], meeting_id: str) -> dict:
    client = get_openai_client()
    settings = get_settings()

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": """You are an expert meeting analyst. Analyze the meeting transcript and extract:
1. A concise executive summary (2-3 paragraphs)
2. 3-7 key discussion points
3. Decisions that were made
4. Overall sentiment (-1 to 1 scale)

Return as JSON with keys: summary, key_points (array), decisions (array), sentiment_score (number -1 to 1)""",
            },
            {
                "role": "user",
                "content": f"Participants: {', '.join(participants)}\n\nTranscript:\n{transcript[:12000]}",
            },
        ],
        temperature=0.3,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content or "{}")
    return {
        "summary": data.get("summary", ""),
        "key_points": data.get("key_points", []),
        "decisions": data.get("decisions", []),
        "sentiment_score": round(float(data.get("sentiment_score", 0)), 2),
    }


async def extract_action_items(transcript: str, participants: list[str]) -> dict:
    client = get_openai_client()
    settings = get_settings()

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": f"""Extract all action items from this meeting transcript.
For each action item, identify:
- title: brief task description
- description: more detailed explanation
- assignee: who is responsible (from participants list if mentioned)
- due_date: if mentioned (ISO format YYYY-MM-DD)
- priority: high/medium/low based on urgency expressed

Participants: {', '.join(participants)}

Return JSON with key "action_items" containing an array of action items.""",
            },
            {
                "role": "user",
                "content": f"Transcript:\n{transcript[:12000]}",
            },
        ],
        temperature=0.2,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content or '{"action_items":[]}')
    return {"action_items": data.get("action_items", [])}


async def generate_followup_email(meeting_id: str, summary: str, action_items: list[dict]) -> dict:
    client = get_openai_client()
    settings = get_settings()

    action_list = "\n".join(
        f"- {item.get('title', '')} (Owner: {item.get('assignee', 'TBD')}, Due: {item.get('due_date', 'TBD')})"
        for item in action_items
    )

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": "You are drafting a professional meeting follow-up email. Be concise, clear, and action-oriented. Return JSON with keys: subject, body",
            },
            {
                "role": "user",
                "content": f"Meeting Summary:\n{summary}\n\nAction Items:\n{action_list}\n\nWrite the follow-up email.",
            },
        ],
        temperature=0.5,
        max_tokens=800,
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content or "{}")
    return {"subject": data.get("subject", "Meeting Follow-Up"), "body": data.get("body", "")}
