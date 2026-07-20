from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.core.security import require_internal_key
from app.schemas.jobs import RemoteJobRequest, RemoteJobResponse
from app.services.jobs import execute_remote_job

router = APIRouter(
    prefix="/jobs",
    tags=["jobs"],
    dependencies=[Depends(require_internal_key)],
)


@router.post("/execute", response_model=RemoteJobResponse)
async def execute(request: Request, job: RemoteJobRequest) -> RemoteJobResponse:
    return await execute_remote_job(request, job)
