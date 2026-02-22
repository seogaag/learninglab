"""
Classroom & Drive API 연결 상태 검증 스크립트

사용법:
  cd backend
  python -m scripts.verify_api_connection [email]

  email: 특정 사용자만 검증 (생략 시 DB의 모든 사용자 검증)
"""
import asyncio
import os
import sys
from typing import Tuple

# backend 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.user import User
from app.services.google_api import (
    get_access_token_from_refresh,
    get_google_classroom_courses,
)
from app.core.config import settings


async def verify_classroom(access_token: str) -> Tuple[bool, str]:
    """Classroom API 호출 테스트"""
    try:
        courses = await get_google_classroom_courses(access_token)
        return True, f"OK (courses: {len(courses)})"
    except Exception as e:
        err = str(e)
        if "403" in err or "Forbidden" in err:
            return False, "403 Forbidden - Google Classroom API 권한 없음 (Console에서 API 활성화 및 OAuth 스코프 확인)"
        return False, err


async def verify_drive_folder(access_token: str, folder_id: str = "0AFTJRkjnxrwNUk9PVA") -> Tuple[bool, str]:
    """Drive API - 특정 폴더 접근 테스트"""
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://www.googleapis.com/drive/v3/files/{folder_id}",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"fields": "id,name", "supportsAllDrives": "true"},
            )
            if r.status_code == 200:
                data = r.json()
                return True, f"OK (folder: {data.get('name', '?')})"
            if r.status_code == 403:
                return False, "403 Forbidden - Drive 권한 없거나 폴더 미공유"
            if r.status_code == 404:
                return False, "404 - 폴더 없음 또는 이 계정과 공유되지 않음"
            return False, f"HTTP {r.status_code}: {r.text[:200]}"
    except Exception as e:
        return False, str(e)


async def check_user(db: Session, user: User) -> None:
    """한 사용자에 대해 전체 검증"""
    print(f"\n--- {user.email} (id={user.id}) ---")
    print(f"  refresh_token: {'있음' if user.google_refresh_token else '없음'}")

    if not user.google_refresh_token:
        print("  [실패] refresh_token 없음 → 로그아웃 후 다시 로그인 필요 (prompt=consent로 권한 재요청)")
        return

    access_token = await get_access_token_from_refresh(user.google_refresh_token)
    if not access_token:
        print("  [실패] refresh_token으로 access_token 발급 실패 → 재로그인 필요")
        return
    print("  access_token: 발급 성공")

    ok, msg = await verify_classroom(access_token)
    print(f"  Classroom API: {'OK' if ok else '실패'} - {msg}")

    ok, msg = await verify_drive_folder(access_token)
    print(f"  Drive API (folder 0AFTJRkjnxrwNUk9PVA): {'OK' if ok else '실패'} - {msg}")


async def main():
    email_filter = sys.argv[1] if len(sys.argv) > 1 else None

    print("=== API 연결 검증 ===")
    print(f"GOOGLE_CLIENT_ID: {'설정됨' if settings.GOOGLE_CLIENT_ID else '미설정'}")
    print(f"GOOGLE_CLIENT_SECRET: {'설정됨' if settings.GOOGLE_CLIENT_SECRET else '미설정'}")

    db = SessionLocal()
    try:
        q = db.query(User)
        if email_filter:
            q = q.filter(User.email == email_filter)
        users = q.all()

        if not users:
            print(f"\n사용자 없음 (email={email_filter})")
            return

        for user in users:
            await check_user(db, user)

        print("\n=== 검증 완료 ===")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
