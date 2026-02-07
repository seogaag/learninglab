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
    """Google Classroom 코스 목록 가져오기 (학생이 수강 중인 클래스)"""
    try:
        async with httpx.AsyncClient() as client:
            # 먼저 ACTIVE 상태의 클래스만 가져오기
            response = await client.get(
                'https://classroom.googleapis.com/v1/courses',
                headers={'Authorization': f'Bearer {access_token}'},
                params={'studentId': 'me', 'courseStates': 'ACTIVE'}
            )
            
            print(f"[GOOGLE_API] Classroom API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                courses = data.get('courses', [])
                print(f"[GOOGLE_API] Found {len(courses)} ACTIVE courses")
                
                # ACTIVE 클래스가 없으면 모든 상태의 클래스 가져오기
                if not courses:
                    print(f"[GOOGLE_API] No ACTIVE courses, fetching all courses...")
                    response_all = await client.get(
                        'https://classroom.googleapis.com/v1/courses',
                        headers={'Authorization': f'Bearer {access_token}'},
                        params={'studentId': 'me'}
                    )
                    if response_all.status_code == 200:
                        data_all = response_all.json()
                        courses = data_all.get('courses', [])
                        print(f"[GOOGLE_API] Found {len(courses)} total courses")
                
                # 클래스 정보 로깅
                for course in courses[:3]:  # 처음 3개만 로깅
                    print(f"[GOOGLE_API] Course: {course.get('name', 'N/A')} (ID: {course.get('id', 'N/A')}, State: {course.get('courseState', 'N/A')})")
                
                return courses
            elif response.status_code == 403:
                print(f"[GOOGLE_API] 403 Forbidden - Permission denied")
                print(f"[GOOGLE_API] Response: {response.text}")
                return []
            else:
                print(f"[GOOGLE_API] Error response: {response.status_code} - {response.text}")
                return []
    except Exception as e:
        print(f"[GOOGLE_API] Error fetching courses: {e}")
        import traceback
        traceback.print_exc()
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
