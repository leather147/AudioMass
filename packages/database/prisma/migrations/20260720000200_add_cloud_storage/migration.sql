CREATE TYPE "StorageProvider" AS ENUM ('S3', 'MINIO', 'SUPABASE', 'VERCEL_BLOB');
CREATE TYPE "StorageObjectStatus" AS ENUM ('PENDING', 'READY', 'REJECTED', 'DELETED');

CREATE TABLE "storage_objects" (
    "id" UUID NOT NULL,
    "projectId" UUID,
    "ownerId" VARCHAR(120) NOT NULL,
    "provider" "StorageProvider" NOT NULL,
    "bucket" VARCHAR(255) NOT NULL,
    "objectKey" VARCHAR(1024) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "contentType" VARCHAR(160) NOT NULL,
    "expectedSize" INTEGER NOT NULL,
    "actualSize" INTEGER,
    "checksumSha256" CHAR(64),
    "etag" VARCHAR(255),
    "externalUrl" VARCHAR(2048),
    "status" "StorageObjectStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),
    CONSTRAINT "storage_objects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "storage_objects_provider_bucket_objectKey_key"
ON "storage_objects"("provider", "bucket", "objectKey");
CREATE INDEX "storage_objects_ownerId_status_createdAt_idx"
ON "storage_objects"("ownerId", "status", "createdAt" DESC);
CREATE INDEX "storage_objects_projectId_createdAt_idx"
ON "storage_objects"("projectId", "createdAt" DESC);

ALTER TABLE "storage_objects"
ADD CONSTRAINT "storage_objects_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
