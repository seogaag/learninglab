from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.admin_auth import require_admin_dep
from app.models.admin import Admin
from typing import List
import os
import shutil
from pathlib import Path
import time

router = APIRouter(prefix="/admin/upload", tags=["admin"])

# 업로드 디렉토리 설정 (Docker 컨테이너 내부 경로)
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024  # 10MB in bytes

def is_allowed_file(filename: str) -> bool:
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """이미지 파일 업로드 (관리자)"""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # 파일 크기 확인
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the limit of {MAX_FILE_SIZE_MB}MB"
        )
    
    # 파일 포인터를 처음으로 되돌림
    await file.seek(0)
    
    # 타임스탬프를 사용하여 고유한 파일명 생성
    timestamp = int(time.time() * 1000)
    ext = Path(file.filename).suffix.lower()
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename
    
    try:
        # 파일 저장
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # URL 반환 (프론트엔드에서 사용할 수 있도록)
        file_url = f"/admin/upload/image/{safe_filename}"
        return {"url": file_url, "filename": safe_filename}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

@router.get("/image/{filename:path}")
async def get_image(filename: str):
    """업로드된 이미지 조회"""
    from urllib.parse import unquote
    # URL 디코딩 (한글 파일명 등 처리)
    decoded_filename = unquote(filename)
    file_path = UPLOAD_DIR / decoded_filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileResponse(file_path)
