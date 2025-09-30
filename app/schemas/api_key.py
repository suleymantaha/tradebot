from pydantic import BaseModel, Field, field_serializer
from typing import Optional, cast
from datetime import datetime
from app.core.crypto import decrypt_value

class ApiKeyCreate(BaseModel):
    api_key: str
    secret_key: str
    label: Optional[str] = None

class ApiKeyResponse(BaseModel):
    id: int
    label: Optional[str]
    api_key_masked: str
    is_valid: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: datetime) -> str:
        return value.isoformat() if value else ""

    @classmethod
    def model_validate_orm(cls, obj):
        # API key'i çöz ve maskele
        try:
            decrypted_api_key = decrypt_value(cast(str, obj.encrypted_api_key))
            masked_api_key = decrypted_api_key[:4] + "****" + decrypted_api_key[-4:] if len(decrypted_api_key) > 8 else "****"
        except:
            masked_api_key = "****"

        return cls(
            id=obj.id,
            label=obj.label,
            api_key_masked=masked_api_key,
            is_valid=obj.is_valid,
            created_at=obj.created_at,
            updated_at=obj.updated_at
        )

    model_config = {
        "from_attributes": True,
        "validate_by_name": True
    }
