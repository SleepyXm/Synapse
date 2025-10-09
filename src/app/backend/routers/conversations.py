from fastapi import APIRouter, HTTPException, Body, Depends
from database import database
from routers.auth_utils import get_current_user
import uuid
from schemas import CreateConversationRequest
import uuid
from typing import List, Dict, Any
from datetime import datetime
from helpers import decompress_messages, append_messages

router = APIRouter()

@router.post("/{conversation_id}/chunk")
async def save_chunk(
    conversation_id: str,
    messages: List[Dict[str, Any]] = Body(...),
    current_user: dict = Depends(get_current_user)
):

    # fetch existing conversation
    query = "SELECT compressed_messages, user_id FROM conversations WHERE id = :conversation_id"
    row = await database.fetch_one(query=query, values={"conversation_id": conversation_id})

    if row and row["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You do not own this conversation")

    existing_compressed = row["compressed_messages"] if row and row["compressed_messages"] else b""
    compressed = append_messages(existing_compressed, messages)

    if row:
        # update existing conversation
        update_query = """
            UPDATE conversations
            SET compressed_messages = :compressed_messages,
                updated_at = NOW()
            WHERE id = :conversation_id
        """
        await database.execute(query=update_query, values={
            "compressed_messages": compressed,
            "conversation_id": conversation_id
        })
    else:
        # insert new conversation with ownership
        insert_query = """
            INSERT INTO conversations (id, user_id, compressed_messages, created_at, updated_at)
            VALUES (:conversation_id, :user_id, :compressed_messages, NOW(), NOW())
        """
        await database.execute(query=insert_query, values={
            "conversation_id": conversation_id,
            "user_id": current_user["id"],
            "compressed_messages": compressed
        })

    return {"status": "ok", "chunk_size": len(messages)}


@router.get("/{conversation_id}/chunk")
async def load_chunks(conversation_id: str, current_user: dict = Depends(get_current_user)):

    query = "SELECT compressed_messages, user_id FROM conversations WHERE id = :conversation_id"
    row = await database.fetch_one(query=query, values={"conversation_id": conversation_id})

    if not row or not row["compressed_messages"]:
        raise HTTPException(status_code=404, detail="No conversation found")

    if row["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You do not own this conversation")

    messages = decompress_messages(row["compressed_messages"])
    return {"messages": [m.dict() for m in messages]}

@router.post("/create")
async def create_conversation(
    req: CreateConversationRequest,
    current_user: dict = Depends(get_current_user)
):
    conversation_id = str(uuid.uuid4())
    now = datetime.utcnow()

    query_insert = """
        INSERT INTO conversations (id, user_id, llm_model, title, created_at, updated_at)
        VALUES (:id, :user_id, :llm_model, NULL, :created_at, :updated_at)
    """
    await database.execute(
        query=query_insert,
        values={
            "id": conversation_id,
            "user_id": current_user["id"],
            "llm_model": req.llm_model,
            "created_at": now,
            "updated_at": now,
        }
    )
    # return null title since LLM will handle it later
    return {"id": conversation_id, "title": None}


@router.get("/list")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    query = "SELECT id, title, llm_model, created_at, updated_at FROM conversations WHERE user_id = :user_id ORDER BY updated_at DESC"
    rows = await database.fetch_all(query=query, values={"user_id": current_user["id"]})

    return {"conversations": [{"id": row["id"], "llm_model": row["llm_model"], "title": row["title"] } for row in rows]}