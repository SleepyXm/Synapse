from fastapi.responses import StreamingResponse
from fastapi import APIRouter
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from schemas import ChatRequest
from search import get_top_paragraphs

import os

router = APIRouter()


client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key="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",
)

# Request model
# class ChatRequest(BaseModel):
#    modelId: str
#    conversation: List[Dict[str, str]]  # {"role": "user"/"assistant", "content": str}


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    async def event_generator():
        conversation = [m.dict() for m in req.conversation]

        # Inject system message dynamically
        last_user_input = conversation[-1]["content"] if conversation else ""

        # 1️⃣ Optional: Inject current date (existing)
        if "current date" in last_user_input.lower() or "today" in last_user_input.lower():
            system_msg = {
                "role": "system",
                "content": f"The current date is {datetime.now().strftime('%B %d, %Y')}.",
            }
            conversation.append(system_msg)

        # 2️⃣ Check if we need to call the search (simple confidence/trigger logic)
        # For now, let's just always fetch for demonstration
        search_paragraphs = get_top_paragraphs(last_user_input)  # your DuckDuckGo scraper
        if search_paragraphs:
            context_msg = {
                "role": "system",
                "content": "Context from external sources:\n" + "\n\n".join(search_paragraphs)
            }
            conversation.append(context_msg)

        stream = client.chat.completions.create(
            model=f"{req.modelId}",
            messages=conversation,
            stream=True,
        )

        assistant_message = {"role": "assistant", "content": ""}

        for chunk in stream:
            if not getattr(chunk, "choices", None):
                continue  # skip empty chunks
            if len(chunk.choices) == 0:
                continue
            delta = getattr(chunk.choices[0].delta, "content", None)
            if delta is not None:
                assistant_message["content"] += delta
                yield delta

    return StreamingResponse(event_generator(), media_type="text/plain")


# 1. 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
# 2. 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
# 3. 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
# 4. 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
