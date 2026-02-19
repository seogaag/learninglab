from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.db.database import engine
from app.api import auth, classroom, calendar, admin_auth, admin_banner, admin_course, admin_upload, admin_page, public, public_page, community, drive


def _ensure_posts_columns():
    """Ensure posts table has is_resolved and like_count (for DBs created before these columns existed)."""
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false"))
            conn.execute(text("ALTER TABLE posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0"))
    except Exception:
        # Table might not exist yet (migrations not run)
        pass


app = FastAPI(
    title="GF Lab API",
    description="Global Marketing Learning Platform API",
    version="1.0.0",
)

# Session Middleware (OAuth를 위해 필요)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY
)

# CORS 설정 (FRONTEND_URL 또는 기본값)
_cors_origins = [o.strip() for o in settings.FRONTEND_URL.split(",") if o.strip()]
if not _cors_origins:
    _cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)
app.include_router(classroom.router)
app.include_router(calendar.router)
app.include_router(admin_auth.router)
app.include_router(admin_banner.router)
app.include_router(admin_course.router)
app.include_router(admin_upload.router)
app.include_router(admin_page.router)
app.include_router(public.router)
app.include_router(public_page.router)
app.include_router(community.router)
app.include_router(drive.router)

@app.on_event("startup")
def startup():
    _ensure_posts_columns()


@app.get("/")
async def root():
    return {"message": "Welcome to GF Lab API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
