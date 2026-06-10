"""
Twin Engine — powers the AI digital twin.
Uses LangGraph for stateful conversation + LlamaIndex RAG for memory retrieval.
Falls back to Claude when OpenAI confidence is low.
"""
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from .rag_engine import search as rag_search
from ..core.config import get_settings
from ..core.deps import get_openai_client, get_anthropic_client
import structlog
import json

logger = structlog.get_logger()


def _build_system_prompt(twin_config: dict, tone: str = "professional") -> str:
    name = twin_config.get("name", "Your Digital Twin")
    personality = twin_config.get("personality_config", {})
    comm_style = twin_config.get("communication_style", {})

    tone_instructions = {
        "professional": "Be concise, precise, and data-driven. Avoid filler words.",
        "casual": "Be friendly, conversational, and approachable. Use natural language.",
        "executive": "Be strategic, high-level, and outcome-focused. Lead with conclusions.",
        "friendly": "Be warm, encouraging, and supportive. Acknowledge feelings first.",
        "strict": "Be direct, firm, and unambiguous. No hedging or qualifiers.",
    }

    return f"""You are {name}, a professional AI digital twin.
You replicate the communication style, knowledge, and decision-making patterns of the real person.

Tone: {tone_instructions.get(tone, tone_instructions['professional'])}

Personality traits: {json.dumps(personality, indent=2)}
Communication style: {json.dumps(comm_style, indent=2)}

You have access to the person's knowledge base, meeting history, and past communications.
Always respond in a way that is consistent with this person's established patterns.
If asked about something outside your knowledge, acknowledge the gap honestly.
Never pretend to have capabilities or information you don't have."""


async def chat(
    twin_id: str,
    org_id: str,
    message: str,
    conversation_history: list[dict],
    twin_config: dict | None = None,
) -> dict:
    settings = get_settings()
    config = twin_config or {}
    tone = config.get("tone_settings", {}).get("default", "professional")

    # Retrieve relevant context from the twin's knowledge base
    relevant_chunks = await rag_search(message, org_id, top_k=5)
    context = "\n\n".join(c["content"] for c in relevant_chunks) if relevant_chunks else ""

    system_prompt = _build_system_prompt(config, tone)
    if context:
        system_prompt += f"\n\nRelevant context from your knowledge base:\n{context}"

    # Build message history for OpenAI
    messages = [{"role": "system", "content": system_prompt}]
    for h in conversation_history[-10:]:  # keep last 10 turns
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    openai_client = get_openai_client()

    try:
        response = await openai_client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            temperature=0.7,
            max_tokens=2000,
            logprobs=True,
            top_logprobs=1,
        )

        content = response.choices[0].message.content or ""
        # Estimate confidence from log probs
        logprobs = response.choices[0].logprobs
        if logprobs and logprobs.content:
            import math
            avg_logprob = sum(t.logprob for t in logprobs.content) / len(logprobs.content)
            confidence = round(min(1.0, max(0.0, math.exp(avg_logprob))), 4)
        else:
            confidence = 0.85

        # If confidence < 0.6, use Claude as fallback for better quality
        if confidence < 0.6:
            anthropic_client = get_anthropic_client()
            claude_response = await anthropic_client.messages.create(
                model=settings.anthropic_model,
                max_tokens=2000,
                system=system_prompt,
                messages=[{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"],
            )
            content = claude_response.content[0].text
            confidence = 0.75  # Claude fallback is considered reliable

        return {
            "response": content,
            "confidence_score": confidence,
            "sources": [c["document_id"] for c in relevant_chunks[:3]],
        }

    except Exception as e:
        logger.error("Twin chat error", error=str(e), twin_id=twin_id)
        raise


async def simulate(twin_id: str, org_id: str, scenario: str, context: dict) -> dict:
    settings = get_settings()
    openai_client = get_openai_client()

    response = await openai_client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": "You are simulating how a specific person would respond in a given scenario. Provide a realistic simulation with reasoning about why they would respond this way.",
            },
            {
                "role": "user",
                "content": f"Scenario: {scenario}\n\nContext: {json.dumps(context)}\n\nProvide the simulated response and your reasoning.",
            },
        ],
        temperature=0.8,
        max_tokens=1500,
    )

    content = response.choices[0].message.content or ""
    lines = content.split("\n\n", 1)
    simulated = lines[0] if lines else content
    reasoning = lines[1] if len(lines) > 1 else "Based on established communication patterns."

    return {"simulated_response": simulated, "reasoning": reasoning, "confidence_score": 0.78}


async def draft_email(
    twin_id: str, org_id: str, thread_context: str, recipient: str, tone: str, subject: str | None
) -> dict:
    settings = get_settings()
    openai_client = get_openai_client()

    response = await openai_client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": f"""You are drafting an email on behalf of an executive.
Tone: {tone}. Be authentic and consistent with the established communication style.
Return your response as JSON with keys: "subject" and "body".""",
            },
            {
                "role": "user",
                "content": f"Thread context: {thread_context}\n\nRecipient: {recipient}\n\n{'Subject: ' + subject if subject else 'Draft an appropriate subject.'}\n\nWrite the email.",
            },
        ],
        temperature=0.6,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )

    import json as json_mod
    data = json_mod.loads(response.choices[0].message.content or "{}")
    return {
        "subject": data.get("subject", subject or "Follow-up"),
        "body": data.get("body", ""),
        "confidence_score": 0.82,
    }
