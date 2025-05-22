from pydantic import BaseModel
from typing import Optional

class ApiKeyCreate(BaseModel):
    api_key: str
    secret_key: str
    label: Optional[str] = None

class ApiKeyResponse(BaseModel):
    id: int
    label: Optional[str]
    is_valid: bool
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True
