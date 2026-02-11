from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.core.security import verify_token
from app.services.google_api import get_access_token_from_refresh
from typing import List, Dict, Any
import httpx

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
    
    if not user.google_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No refresh token found"
        )
    
    # Access token 가져오기
    access_token = await get_access_token_from_refresh(user.google_refresh_token)
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get access token"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # 폴더 정보 가져오기
            folder_response = await client.get(
                f'https://www.googleapis.com/drive/v3/files/{folder_id}',
                headers={'Authorization': f'Bearer {access_token}'},
                params={'fields': 'id,name,mimeType,parents'}
            )
            
            if folder_response.status_code != 200:
                raise HTTPException(
                    status_code=folder_response.status_code,
                    detail="Failed to get folder info"
                )
            
            folder_info = folder_response.json()
            
            # 폴더 내 파일 및 하위 폴더 목록 가져오기
            files_response = await client.get(
                'https://www.googleapis.com/drive/v3/files',
                headers={'Authorization': f'Bearer {access_token}'},
                params={
                    'q': f"'{folder_id}' in parents and trashed=false",
                    'fields': 'files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink)',
                    'orderBy': 'folder,name'
                }
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
