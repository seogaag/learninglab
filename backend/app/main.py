from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.core.config import settings
from app.api import auth, classroom, calendar

app = FastAPI(
    title="Insight Hub API",
    description="Global Marketing Learning Platform API",
    version="1.0.0",
)

# Session Middleware (OAuth를 위해 필요)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)
app.include_router(classroom.router)
app.include_router(calendar.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Insight Hub API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
