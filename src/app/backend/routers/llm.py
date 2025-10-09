from fastapi.responses import StreamingResponse
from fastapi import APIRouter
from openai import OpenAI
from datetime import datetime
from schemas import ChatRequest
from search import get_top_paragraphs, should_search
from database import database

router = APIRouter()

class LLM:
    def __init__(self, model_id: str, hf_token: str):
        self.model_id = model_id
        self.client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=hf_token,
        )
        
    async def generate_conversation_title(self, conversation_snippet: str) -> str:
        messages = [
            {
                "role": "system",
                "content": "You are an assistant that creates short, descriptive titles for conversations."
            },
            {
                "role": "user",
                "content": f"Generate a concise title for this conversation: {conversation_snippet}"
            }
        ]
            
        response = self.client.chat.completions.create(
            model=self.model_id,
            messages=messages,
            max_tokens=12,
        )
            
        return response.choices[0].message.content.strip()
    
    async def stream_response(self, messages: list[dict]):
        stream = self.client.chat.completions.create(
            model=self.model_id,
            messages=messages,
            stream=True,
            )
        assistant_message = {"role": "assistant", "content": ""}
            
        for chunk in stream:
            if not getattr(chunk, "choices", None):
                continue
            if len(chunk.choices) == 0:
                continue
            delta = getattr(chunk.choices[0].delta, "content", None)
            if delta:
                assistant_message["content"] += delta
                yield delta


async def try_generate_title(conversation_id: str, llm: LLM, messages: list[dict]):
    if not messages:
        return

    first_user_message = messages[0]["content"]
    conversation_record = await database.fetch_one(
        "SELECT title FROM conversations WHERE id = :id",
        {"id": conversation_id}
    )

    if conversation_record and conversation_record["title"] is None:
        title = await llm.generate_conversation_title(first_user_message)
        await database.execute(
            """
            UPDATE conversations SET title = :title, updated_at = :updated_at WHERE id = :id
            """,
            {"title": title, "updated_at": datetime.utcnow(), "id": conversation_id}
        )

@router.post("/chat/stream")
async def chat_stream(req: ChatRequest, conversation_id: str):
    async def event_generator():
        # Instantiate LLM per request
        llm = LLM(model_id=req.modelId, hf_token=req.hfToken)

        conversation = [m.dict() for m in req.conversation]
        await try_generate_title(conversation_id, llm, conversation)

        last_user_input = conversation[-1]["content"] if conversation else ""

        # Inject system message dynamically
        if "current date" in last_user_input.lower() or "today" in last_user_input.lower():
            conversation.append({
                "role": "system",
                "content": f"The current date is {datetime.now().strftime('%B %d, %Y')}.",
            })

        # Check if we need to call search
        if should_search(last_user_input):
            search_paragraphs = get_top_paragraphs(last_user_input)
            if search_paragraphs:
                conversation.append({
                    "role": "system",
                    "content": "Context from external sources:\n" + "\n\n".join(search_paragraphs),
                })

        # Stream the assistant response using the instance
        async for delta in llm.stream_response(conversation):
            yield delta

    return StreamingResponse(event_generator(), media_type="text/plain")

# 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