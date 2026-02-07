import httpx
from typing import Optional, Dict, Any, List
from app.core.config import settings

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
    """Google Classroom 코스 목록 가져오기"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://classroom.googleapis.com/v1/courses',
                headers={'Authorization': f'Bearer {access_token}'},
                params={'studentId': 'me', 'courseStates': 'ACTIVE'}
            )
            if response.status_code == 200:
                data = response.json()
                return data.get('courses', [])
    except Exception as e:
        print(f"Error fetching courses: {e}")
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
            if response.status_code == 200:
                data = response.json()
                return data.get('items', [])
    except Exception as e:
        print(f"Error fetching calendar events: {e}")
    return []
