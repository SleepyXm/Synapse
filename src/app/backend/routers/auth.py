from fastapi import APIRouter, HTTPException, Depends, Cookie
from fastapi import Response
from fastapi.responses import JSONResponse
from passlib.context import CryptContext
from database import database
from routers.auth_utils import create_access_token, get_current_user
import uuid
from schemas import UserCreate, UserLogin

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

    # Return the correct token in response
    return resp

@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    # Returns 401 automatically if no valid cookie
    return {"username": current_user["username"]}

@router.post("/logout")
async def logout(response: Response):
    # Clear cookies/session here
    response.delete_cookie("access_token")  # or however you handle sessions
    return {"message": "Logged out successfully"}