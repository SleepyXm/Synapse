from schemas import MessageOut
from typing import List, Dict, Any
from datetime import datetime
import zlib
import json
import uuid

def compress_messages(messages: List["MessageOut"]) -> bytes:
    return zlib.compress(json.dumps(
        [m.dict() for m in messages],
        default=lambda o: o.isoformat() if isinstance(o, datetime) else o
    ).encode("utf-8"))

def decompress_messages(data: bytes) -> List["MessageOut"]:
    if not data:
        return []
    raw = zlib.decompress(data)
    items = json.loads(raw)
    # convert created_at back into datetime objects
    for m in items:
        if "created_at" in m and isinstance(m["created_at"], str):
            try:
                m["created_at"] = datetime.fromisoformat(m["created_at"])
            except Exception:
                pass
    return [MessageOut(**m) for m in items]

def append_messages(existing_compressed: bytes, new_messages: List[Dict[str, Any]]) -> bytes:
    messages = decompress_messages(existing_compressed)
    now = datetime.utcnow()
    messages.extend([
        MessageOut(
            id=str(uuid.uuid4()),
            message=m,  # raw JSON from frontend
            role=m.get("role", "user"),
            created_at=now
        ) for m in new_messages
    ])
    return compress_messages(messages)


# Example usage: