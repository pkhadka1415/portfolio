from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import httpx
from openai import OpenAI
import json
import os

app = FastAPI(title="StackAssist API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

STACK_API_URL = "https://api.stackexchange.com/2.3/search/advanced"

CLIENT = OpenAI(
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)


async def fetch_stackoverflow(query: str, num_results: int = 5) -> list[dict]:
    params = {
        "order": "desc",
        "sort": "relevance",
        "q": query,
        "site": "stackoverflow",
        "pagesize": num_results,
        "filter": "withbody",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(STACK_API_URL, params=params)
        resp.raise_for_status()
        data = resp.json()
        return data.get("items", [])


def build_prompt(query: str, threads: list[dict]) -> str:
    context_parts = []
    for i, item in enumerate(threads[:5], 1):
        title = item.get("title", "")
        body = item.get("body", "")[:800]
        score = item.get("score", 0)
        link = item.get("link", "")
        context_parts.append(
            f"[Thread {i}] Score: {score}\nTitle: {title}\nURL: {link}\nBody: {body}\n"
        )
    context = "\n---\n".join(context_parts)
    return f"""You are a senior developer assistant. A developer has the following problem:

PROBLEM:
{query}

Here are the most relevant Stack Overflow threads found:

{context}

Based on these threads, provide a clear, concise answer to the developer's problem.
- Summarize the best solution(s)
- Include any important caveats or alternatives
- Keep code examples short and focused
- Be direct and practical"""


async def stream_ai_answer(query: str, threads: list[dict]):
    sources = [
        {"title": t.get("title", ""), "link": t.get("link", ""), "score": t.get("score", 0)}
        for t in threads[:5]
    ]
    yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"
    yield f"data: {json.dumps({'type': 'status', 'message': '🤖 Generating AI answer...'})}\n\n"

    prompt = build_prompt(query, threads)

    response = CLIENT.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": prompt}],
        stream=True
    )
    for chunk in response:
        text = chunk.choices[0].delta.content or ""
        if text:
            yield f"data: {json.dumps({'type': 'token', 'content': text})}\n\n"

    yield f"data: {json.dumps({'type': 'done'})}\n\n"


@app.get("/api/search")
async def search(q: str = Query(..., min_length=3, description="Coding question or error")):
    async def event_generator():
        try:
            yield f"data: {json.dumps({'type': 'status', 'message': '🔍 Searching Stack Overflow...'})}\n\n"

            threads = await fetch_stackoverflow(q)

            if not threads:
                yield f"data: {json.dumps({'type': 'error', 'message': 'No Stack Overflow results found.'})}\n\n"
                return

            async for chunk in stream_ai_answer(q, threads):
                yield chunk

        except httpx.HTTPError as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Stack Overflow API error: {str(e)}'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/health")
async def health():
    return {"status": "ok"}