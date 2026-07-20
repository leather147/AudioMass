CREATE TYPE "ProjectVisibility" AS ENUM ('PRIVATE', 'SHARED');
CREATE TYPE "ProcessingJobKind" AS ENUM ('ANALYZE', 'NORMALIZE', 'TRANSCRIBE', 'STEM_SEPARATION', 'MASTER');
CREATE TYPE "ProcessingJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "ownerId" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(2000),
    "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PRIVATE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "processing_jobs" (
    "id" UUID NOT NULL,
    "projectId" UUID,
    "kind" "ProcessingJobKind" NOT NULL,
    "status" "ProcessingJobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "idempotencyKey" VARCHAR(128),
    "errorCode" VARCHAR(80),
    "errorMessage" VARCHAR(2000),
    "startedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "projects_ownerId_updatedAt_idx" ON "projects"("ownerId", "updatedAt" DESC);
CREATE UNIQUE INDEX "processing_jobs_idempotencyKey_key" ON "processing_jobs"("idempotencyKey");
CREATE INDEX "processing_jobs_status_createdAt_idx" ON "processing_jobs"("status", "createdAt");
CREATE INDEX "processing_jobs_projectId_createdAt_idx" ON "processing_jobs"("projectId", "createdAt" DESC);

ALTER TABLE "processing_jobs"
ADD CONSTRAINT "processing_jobs_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
