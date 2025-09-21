from fastapi import APIRouter, HTTPException, Depends, Cookie
from fastapi import Response
from fastapi.responses import JSONResponse
from passlib.context import CryptContext
from database import database
from routers.auth_utils import create_access_token, get_current_user
import uuid
from schemas import UserCreate, UserLogin, HFTokenRequest
import json

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

@router.post("/signup")
async def signup(user: UserCreate):
    query = "SELECT * FROM users WHERE username = :username"
    existing_user = await database.fetch_one(query=query, values={"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username taken, try another.")
    
    hashed_pw = hash_password(user.password)
    insert_query = """
    INSERT INTO users (id, username, password, created_at)
    VALUES (:id, :username, :password, NOW())
    """
    await database.execute(
        query=insert_query,
        values={
            "id": str(uuid.uuid4()),
            "username": user.username,
            "password": hashed_pw,
        }
    )
    return {"message": "User created successfully"}



@router.post("/login")
async def login(user: UserLogin, response: Response):
    query = "SELECT * FROM users WHERE username = :username"
    db_user = await database.fetch_one(query=query, values={"username": user.username})

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Username or Password Incorrect.")

    access_token = create_access_token(str(db_user["id"]))

    # Set JWT as HttpOnly cookie
    resp = JSONResponse(content={"message": "Login successful", "token": access_token})
    resp.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=60 * 60 * 24 * 7,  # 7 days expiry
        expires=60 * 60 * 24 * 7,
        path="/",
        secure=False,  # Set True in production with HTTPS
        samesite="lax",
        domain="localhost",
    )


    return resp

@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    query = "SELECT username, hf_tokens FROM users WHERE id = :user_id"
    db_user = await database.fetch_one(query=query, values={"user_id": current_user["id"]})

    # Ensure hf_tokens is returned as a list
    try:
        hf_tokens_list = json.loads(db_user["hf_tokens"]) if db_user["hf_tokens"] else []
    except Exception:
        hf_tokens_list = []

    return {
        "username": db_user["username"],
        "hf_token": hf_tokens_list,
    }

@router.post("/hf_token")
async def add_hf_token(req: HFTokenRequest, current_user: dict = Depends(get_current_user)):
    query = "SELECT hf_tokens FROM users WHERE id = :user_id"
    db_user = await database.fetch_one(query=query, values={"user_id": current_user["id"]})
    current_tokens = json.loads(db_user["hf_tokens"]) if db_user["hf_tokens"] else []

    if req.hf_token in current_tokens:
        raise HTTPException(status_code=400, detail="Token already exists")

    current_tokens.append(req.hf_token)
    update_query = "UPDATE users SET hf_tokens = :hf_tokens WHERE id = :user_id"
    await database.execute(query=update_query, values={"hf_tokens": json.dumps(current_tokens), "user_id": current_user["id"]})

    return {"message": "HF Token added successfully", "hf_tokens": current_tokens}


@router.delete("/hf_token")
async def remove_hf_token(req: HFTokenRequest, current_user: dict = Depends(get_current_user)):
    query = "SELECT hf_tokens FROM users WHERE id = :user_id"
    db_user = await database.fetch_one(query=query, values={"user_id": current_user["id"]})
    current_tokens = json.loads(db_user["hf_tokens"]) if db_user["hf_tokens"] else []

    if req.hf_token not in current_tokens:
        raise HTTPException(status_code=404, detail="Token not found")

    current_tokens.remove(req.hf_token)
    update_query = "UPDATE users SET hf_tokens = :hf_tokens WHERE id = :user_id"
    await database.execute(query=update_query, values={"hf_tokens": json.dumps(current_tokens), "user_id": current_user["id"]})

    return {"message": "HF Token deleted successfully", "hf_tokens": current_tokens}


@router.post("/logout")
async def logout(response: Response):
    # Clear cookies/session here
    response.delete_cookie("access_token")  # or however you handle sessions
    return {"message": "Logged out successfully"}