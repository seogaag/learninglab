import httpx
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from app.core.config import settings

# Service account credentials (lazy load)
_service_account_credentials = None

def _get_service_account_access_token(write: bool = False) -> Optional[str]:
    """Service account로 Drive API용 access token 발급 (readonly 또는 write)"""
    try:
        cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS or ""
        json_str = settings.GOOGLE_SERVICE_ACCOUNT_JSON or ""
        scope = "https://www.googleapis.com/auth/drive" if write else "https://www.googleapis.com/auth/drive.readonly"

        if cred_path and Path(cred_path).exists():
            from google.oauth2 import service_account
            creds = service_account.Credentials.from_service_account_file(cred_path, scopes=[scope])
        elif json_str.strip().startswith("{"):
            from google.oauth2 import service_account
            info = json.loads(json_str)
            creds = service_account.Credentials.from_service_account_info(info, scopes=[scope])
        else:
            return None

        from google.auth.transport.requests import Request
        creds.refresh(Request())
        return creds.token
    except Exception as e:
        print(f"[GOOGLE_API] Service account token error: {e}")
        return None


async def get_access_token_from_refresh(refresh_token: str) -> Optional[str]:
    """Refresh token을 사용하여 새로운 access token 가져오기"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://oauth2.googleapis.com/token',
                data={
                    'client_id': settings.GOOGLE_CLIENT_ID,
                    'client_secret': settings.GOOGLE_CLIENT_SECRET,
                    'refresh_token': refresh_token,
                    'grant_type': 'refresh_token'
                }
            )
            if response.status_code == 200:
                data = response.json()
                return data.get('access_token')
    except Exception as e:
        print(f"Error refreshing token: {e}")
    return None

async def get_google_classroom_courses(access_token: str) -> List[Dict[str, Any]]:
    """Google Classroom 코스 목록 가져오기 (학생 + 교사 클래스)"""
    try:
        async with httpx.AsyncClient() as client:
            seen_ids = set()
            courses: List[Dict[str, Any]] = []
            headers = {'Authorization': f'Bearer {access_token}'}

            async def fetch_page(params: dict, page_token: str = None) -> tuple:
                p = dict(params)
                if page_token:
                    p['pageToken'] = page_token
                resp = await client.get(
                    'https://classroom.googleapis.com/v1/courses',
                    headers=headers,
                    params=p
                )
                if resp.status_code == 403:
                    raise Exception("403 Forbidden - Google Classroom API permission is required. Please re-authenticate.")
                if resp.status_code != 200:
                    print(f"[GOOGLE_API] Classroom API non-200: {resp.status_code} - {resp.text[:200]}")
                    return [], None
                data = resp.json()
                return data.get('courses') or [], data.get('nextPageToken')

            def merge(new_list: List[Dict[str, Any]]):
                for c in new_list:
                    cid = c.get('id')
                    if cid and cid not in seen_ids:
                        seen_ids.add(cid)
                        courses.append(c)

            # 1) 학생 클래스 (courseStates 없음 = 모든 상태)
            page_token = None
            for _ in range(10):  # max 10 pages
                batch, page_token = await fetch_page({'studentId': 'me'}, page_token)
                merge(batch)
                if not page_token:
                    break
            print(f"[GOOGLE_API] Student courses: {len(courses)}")

            # 2) 교사 클래스
            page_token = None
            for _ in range(10):
                batch, page_token = await fetch_page({'teacherId': 'me'}, page_token)
                merge(batch)
                if not page_token:
                    break
            print(f"[GOOGLE_API] Total (students+teachers): {len(courses)}")
            for c in courses[:3]:
                print(f"[GOOGLE_API] Course: {c.get('name', 'N/A')} (ID: {c.get('id')}, State: {c.get('courseState')})")
            return courses
    except Exception as e:
        print(f"[GOOGLE_API] Error fetching courses: {e}")
        import traceback
        traceback.print_exc()
        if "403" in str(e) or "Forbidden" in str(e):
            raise
        return []

async def get_google_classroom_coursework(course_id: str, access_token: str) -> List[Dict[str, Any]]:
    """특정 코스의 과제 목록 가져오기"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f'https://classroom.googleapis.com/v1/courses/{course_id}/courseWork',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            if response.status_code == 200:
                data = response.json()
                return data.get('courseWork', [])
    except Exception as e:
        print(f"Error fetching coursework: {e}")
    return []

async def get_google_calendar_events(access_token: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """Google Calendar 이벤트 가져오기"""
    try:
        from datetime import datetime, timedelta
        time_min = datetime.utcnow().isoformat() + 'Z'
        time_max = (datetime.utcnow() + timedelta(days=30)).isoformat() + 'Z'
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://www.googleapis.com/calendar/v3/calendars/primary/events',
                headers={'Authorization': f'Bearer {access_token}'},
                params={
                    'timeMin': time_min,
                    'timeMax': time_max,
                    'maxResults': max_results,
                    'singleEvents': True,
                    'orderBy': 'startTime'
                }
            )
            
            print(f"[GOOGLE_API] Calendar API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('items', [])
                print(f"[GOOGLE_API] Found {len(events)} calendar events")
                return events
            elif response.status_code == 403:
                print(f"[GOOGLE_API] 403 Forbidden - Calendar API permission denied")
                print(f"[GOOGLE_API] Response: {response.text}")
                # 403 에러는 권한 문제이므로 빈 배열 반환
                return []
            else:
                print(f"[GOOGLE_API] Calendar API error response: {response.status_code} - {response.text}")
                return []
    except Exception as e:
        print(f"[GOOGLE_API] Error fetching calendar events: {e}")
        import traceback
        traceback.print_exc()
    return []
