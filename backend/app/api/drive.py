from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.core.security import verify_token
from app.services.google_api import get_access_token_from_refresh
from app.core.config import settings
from typing import List, Dict, Any
import httpx
import json

router = APIRouter(prefix="/drive", tags=["drive"])

def get_current_user_from_token(token: str, db: Session) -> User:
    """토큰에서 현재 사용자 가져오기"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.get("/folders/{folder_id}/contents")
async def get_folder_contents(
    folder_id: str,
    token: str = Query(..., description="User authentication token"),
    db: Session = Depends(get_db)
):
    """Google Drive 폴더 내용 가져오기 (로그인한 사용자 계정 사용)"""
    user = get_current_user_from_token(token, db)

    # 로그인한 사용자의 refresh token 사용 (Service Account 사용 안 함)
    access_token = None
    if user.google_refresh_token:
        access_token = await get_access_token_from_refresh(user.google_refresh_token)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Drive access requires signing in with Google. Please sign out and sign in again to grant Drive permission."
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # 폴더 정보 가져오기
            folder_response = await client.get(
                f'https://www.googleapis.com/drive/v3/files/{folder_id}',
                headers={'Authorization': f'Bearer {access_token}'},
                params={'fields': 'id,name,mimeType,parents,driveId', 'supportsAllDrives': 'true'}
            )
            
            if folder_response.status_code != 200:
                raise HTTPException(
                    status_code=folder_response.status_code,
                    detail="Failed to get folder info"
                )
            
            folder_info = folder_response.json()
            drive_id = folder_info.get('driveId') or (folder_id if folder_id.startswith('0A') else None)

            # 폴더 내 파일 및 하위 폴더 목록 (공유 드라이브 루트 지원)
            files_params = {
                'q': f"'{folder_id}' in parents and trashed=false",
                'fields': 'files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink)',
                'orderBy': 'folder,name',
                'supportsAllDrives': 'true',
                'includeItemsFromAllDrives': 'true'
            }
            if drive_id:
                files_params['driveId'] = drive_id
                files_params['corpora'] = 'drive'

            files_response = await client.get(
                'https://www.googleapis.com/drive/v3/files',
                headers={'Authorization': f'Bearer {access_token}'},
                params=files_params
            )
            
            if files_response.status_code != 200:
                error_text = files_response.text
                print(f"[DRIVE] Failed to get folder contents: {files_response.status_code} - {error_text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to get folder contents: {error_text}"
                )
            
            files_data = files_response.json()
            
            return {
                "folder": folder_info,
                "contents": files_data.get("files", []),
                "parent_id": folder_info.get("parents", [None])[0] if folder_info.get("parents") else None
            }
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Google Drive API error: {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching folder contents: {str(e)}"
        )


@router.post("/folders/{folder_id}/upload")
async def upload_file_to_folder(
    folder_id: str,
    file: UploadFile = File(...),
    token: str = Query(..., description="User authentication token"),
    db: Session = Depends(get_db)
):
    """파일을 Google Drive 폴더에 업로드 (로그인한 사용자 계정 사용)"""
    user = get_current_user_from_token(token, db)

    # 로그인한 사용자의 refresh token 사용
    access_token = None
    if user.google_refresh_token:
        access_token = await get_access_token_from_refresh(user.google_refresh_token)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Upload requires signing in with Google. Please sign out and sign in again to grant Drive upload permission."
        )

    try:
        content = await file.read()
        metadata = {"name": file.filename or "upload", "parents": [folder_id]}
        boundary = "-------314159265358979323846"
        body = (
            f"--{boundary}\r\n"
            "Content-Type: application/json; charset=UTF-8\r\n\r\n"
            f"{json.dumps(metadata)}\r\n"
            f"--{boundary}\r\n"
            f"Content-Type: {file.content_type or 'application/octet-stream'}\r\n\r\n"
        ).encode("utf-8") + content + f"\r\n--{boundary}--".encode("utf-8")

        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": f"multipart/related; boundary={boundary}",
                },
                content=body,
            )
        if r.status_code not in (200, 201):
            print(f"[DRIVE] Upload error: {r.status_code} - {r.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Upload failed: {r.text}"
            )
        return r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload error: {str(e)}"
        )
