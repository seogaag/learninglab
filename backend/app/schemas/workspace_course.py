from pydantic import BaseModel
from typing import Optional

class WorkspaceCourseCreate(BaseModel):
    name: str
    description: Optional[str] = None
    section: Optional[str] = None
    image_url: Optional[str] = None
    alternate_link: Optional[str] = None
    course_state: str = 'ACTIVE'
    organization: Optional[str] = None
    order: int = 0
    is_active: bool = True

class WorkspaceCourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    section: Optional[str] = None
    image_url: Optional[str] = None
    alternate_link: Optional[str] = None
    course_state: Optional[str] = None
    organization: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class WorkspaceCourseResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    section: Optional[str] = None
    image_url: Optional[str] = None
    alternate_link: Optional[str] = None
    course_state: str
    organization: Optional[str] = None
    order: int
    is_active: bool
    
    class Config:
        from_attributes = True
