from typing import Any, Optional
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None


def ok(data: Any = None) -> ApiResponse:
    return ApiResponse(success=True, data=data)


def fail(code: str, message: str, details: Any = None) -> ApiResponse:
    return ApiResponse(success=False, error=ErrorDetail(code=code, message=message, details=details))
