import uuid
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from ..core.deps import get_qdrant_client, get_openai_client
from ..core.config import get_settings
from .embedding_service import get_single_embedding, get_embeddings
import structlog

logger = structlog.get_logger()
VECTOR_SIZE = 3072  # text-embedding-3-large


async def ensure_collection() -> None:
    client = get_qdrant_client()
    settings = get_settings()
    collection_name = settings.qdrant_collection
    try:
        await client.get_collection(collection_name)
    except Exception:
        await client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
        logger.info("Qdrant collection created", collection=collection_name)


async def index_chunks(chunks: list[dict]) -> list[str]:
    """
    chunks: list of {content, document_id, org_id, chunk_index, metadata}
    Returns list of qdrant point ids.
    """
    await ensure_collection()
    client = get_qdrant_client()
    settings = get_settings()

    texts = [c["content"] for c in chunks]
    embeddings = await get_embeddings(texts)

    points = []
    point_ids = []
    for chunk, embedding in zip(chunks, embeddings):
        point_id = str(uuid.uuid4())
        point_ids.append(point_id)
        points.append(
            PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "content": chunk["content"],
                    "document_id": chunk["document_id"],
                    "org_id": chunk["org_id"],
                    "chunk_index": chunk["chunk_index"],
                    **(chunk.get("metadata") or {}),
                },
            )
        )

    batch_size = 100
    for i in range(0, len(points), batch_size):
        await client.upsert(
            collection_name=settings.qdrant_collection,
            points=points[i : i + batch_size],
        )

    return point_ids


async def search(query: str, org_id: str, top_k: int = 10, filters: dict | None = None) -> list[dict]:
    await ensure_collection()
    client = get_qdrant_client()
    settings = get_settings()

    query_embedding = await get_single_embedding(query)

    qdrant_filter = Filter(
        must=[FieldCondition(key="org_id", match=MatchValue(value=org_id))]
    )

    results = await client.search(
        collection_name=settings.qdrant_collection,
        query_vector=query_embedding,
        query_filter=qdrant_filter,
        limit=top_k,
        with_payload=True,
    )

    return [
        {
            "content": r.payload.get("content", ""),
            "score": r.score,
            "document_id": r.payload.get("document_id", ""),
            "chunk_index": r.payload.get("chunk_index", 0),
            "source": r.payload.get("source", ""),
            "point_id": str(r.id),
        }
        for r in results
    ]


async def answer_question(question: str, org_id: str, twin_id: str | None = None) -> dict:
    chunks = await search(question, org_id, top_k=8)
    context = "\n\n---\n\n".join(c["content"] for c in chunks)

    client = get_openai_client()
    settings = get_settings()

    twin_context = f"You are acting as a digital twin (ID: {twin_id})." if twin_id else "You are a helpful AI assistant."

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": f"""{twin_context}
Answer questions using only the provided context. If the answer is not in the context, say so clearly.
Be concise, accurate, and cite your sources.""",
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {question}",
            },
        ],
        temperature=0.2,
        max_tokens=1500,
    )

    answer = response.choices[0].message.content or ""
    sources = list({c["document_id"] for c in chunks})
    confidence = sum(c["score"] for c in chunks) / len(chunks) if chunks else 0.0

    return {"answer": answer, "sources": sources, "confidence": round(confidence, 4)}
