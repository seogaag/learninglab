from pydantic import BaseModel
from typing import Optional

class BannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image_url: str
    link_url: Optional[str] = None
    order: int = 0
    is_active: bool = True

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class BannerResponse(BaseModel):
    id: int
    title: str
    subtitle: Optional[str] = None
    image_url: str
    link_url: Optional[str] = None
    order: int
    is_active: bool
    
    class Config:
        from_attributes = True
