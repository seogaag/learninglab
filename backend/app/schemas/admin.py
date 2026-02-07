from pydantic import BaseModel, EmailStr
from typing import Optional

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminCreate(BaseModel):
    username: str
    password: str
    email: Optional[EmailStr] = None
    name: Optional[str] = None

class AdminResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    name: Optional[str] = None
    is_active: bool
    
    class Config:
        from_attributes = True

class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
