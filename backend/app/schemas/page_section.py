from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class PageSectionBase(BaseModel):
    section_type: str
    title: Optional[str] = None
    order: int = 0
    is_active: bool = True
    data: Optional[Dict[str, Any]] = None

class PageSectionCreate(PageSectionBase):
    pass

class PageSectionUpdate(BaseModel):
    section_type: Optional[str] = None
    title: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None
    data: Optional[Dict[str, Any]] = None

class PageSectionResponse(PageSectionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
