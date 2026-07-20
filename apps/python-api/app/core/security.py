from __future__ import annotations

import hmac
from typing import Annotated

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.core.config import get_settings

internal_key_header = APIKeyHeader(name="x-internal-api-key", auto_error=False)


def require_internal_key(
    x_internal_api_key: Annotated[str | None, Security(internal_key_header)],
) -> None:
    expected = get_settings().internal_key
    if x_internal_api_key is None or not hmac.compare_digest(x_internal_api_key, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid x-internal-api-key header is required",
        )
