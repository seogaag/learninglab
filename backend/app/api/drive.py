from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.core.security import verify_token
from app.services.google_api import get_access_token_from_refresh, _get_service_account_access_token
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
    """Google Drive 폴더 내용 가져오기"""
    user = get_current_user_from_token(token, db)

    # 1) Service account 우선 시도 (폴더를 서비스 계정과 공유하면 403 해결)
    access_token = None
    if settings.GOOGLE_SERVICE_ACCOUNT_JSON or settings.GOOGLE_APPLICATION_CREDENTIALS:
        access_token = _get_service_account_access_token()

    # 2) 없으면 사용자 refresh token 사용
    if not access_token and user.google_refresh_token:
        access_token = await get_access_token_from_refresh(user.google_refresh_token)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No access to Drive. Configure GOOGLE_SERVICE_ACCOUNT_JSON and share the folder with the service account, or ensure your account has Drive access."
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


@router.get("/shared/{folder_id}/contents")
async def get_shared_folder_contents(folder_id: str):
    """공유 Drive 폴더 조회 (서비스 계정 전용, 토큰 불필요). Invalid token 시 대체용."""
    access_token = _get_service_account_access_token()
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service account not configured. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON."
        )
    try:
        async with httpx.AsyncClient() as client:
            folder_res = await client.get(
                f'https://www.googleapis.com/drive/v3/files/{folder_id}',
                headers={'Authorization': f'Bearer {access_token}'},
                params={'fields': 'id,name,mimeType,parents,driveId', 'supportsAllDrives': 'true'}
            )
            if folder_res.status_code != 200:
                raise HTTPException(status_code=folder_res.status_code, detail="Failed to get folder info")
            folder_info = folder_res.json()

            drive_id = folder_info.get('driveId') or (folder_id if folder_id.startswith('0A') else None)
            if drive_id:
                files_res = await client.get(
                    'https://www.googleapis.com/drive/v3/files',
                    headers={'Authorization': f'Bearer {access_token}'},
                    params={
                        'q': f"'{folder_id}' in parents and trashed=false",
                        'driveId': drive_id,
                        'corpora': 'drive',
                        'includeItemsFromAllDrives': 'true',
                        'supportsAllDrives': 'true',
                        'fields': 'files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink)',
                        'orderBy': 'folder,name'
                    }
                )
            else:
                files_res = await client.get(
                    'https://www.googleapis.com/drive/v3/files',
                    headers={'Authorization': f'Bearer {access_token}'},
                    params={
                        'q': f"'{folder_id}' in parents and trashed=false",
                        'fields': 'files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink)',
                        'orderBy': 'folder,name',
                        'supportsAllDrives': 'true',
                        'includeItemsFromAllDrives': 'true'
                    }
                )
            if files_res.status_code != 200:
                print(f"[DRIVE] Shared folder error: {files_res.status_code} - {files_res.text}")
                raise HTTPException(status_code=400, detail=f"Failed to get folder contents")
            files_data = files_res.json()
            return {
                "folder": folder_info,
                "contents": files_data.get("files", []),
                "parent_id": folder_info.get("parents", [None])[0] if folder_info.get("parents") else None
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )


@router.post("/folders/{folder_id}/upload")
async def upload_file_to_folder(
    folder_id: str,
    file: UploadFile = File(...),
    token: str = Query(..., description="User authentication token"),
    db: Session = Depends(get_db)
):
    """파일을 Google Drive 폴더에 업로드 (서비스 계정 우선, 없으면 사용자 토큰 사용)"""
    user = get_current_user_from_token(token, db)

    # 1) 서비스 계정 우선
    access_token = _get_service_account_access_token(write=True)
    # 2) 없으면 사용자 refresh token (drive.file 스코프 필요, 재로그인 후 적용)
    if not access_token and user.google_refresh_token:
        access_token = await get_access_token_from_refresh(user.google_refresh_token)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Upload requires either: 1) GOOGLE_APPLICATION_CREDENTIALS with folder shared as Editor, or 2) Sign out and sign in again to grant Drive upload permission."
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
