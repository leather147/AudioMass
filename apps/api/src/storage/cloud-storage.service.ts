import { Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { StorageProvider } from '@audiomass/database';

import { S3StorageAdapter } from './providers/s3-storage.adapter.js';
import { SupabaseStorageAdapter } from './providers/supabase-storage.adapter.js';
import { VercelBlobStorageAdapter } from './providers/vercel-blob-storage.adapter.js';
import type {
  CloudStorageAdapter,
  DownloadGrant,
  StoredObjectMetadata,
  UploadGrant,
  UploadGrantRequest,
} from './storage.types.js';

@Injectable()
export class CloudStorageService implements CloudStorageAdapter {
  private readonly adapter: CloudStorageAdapter;
  public readonly maxUploadBytes: number;

  public constructor(config: ConfigService) {
    const provider = config.getOrThrow<StorageProvider>('STORAGE_PROVIDER');
    const bucket = config.getOrThrow<string>('STORAGE_BUCKET');
    const ttlSeconds = config.getOrThrow<number>('STORAGE_URL_TTL_SECONDS');
    this.maxUploadBytes = config.getOrThrow<number>('STORAGE_MAX_UPLOAD_BYTES');

    if (provider === 'SUPABASE') {
      this.adapter = new SupabaseStorageAdapter({
        bucket,
        serviceRoleKey: config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
        ttlSeconds,
        url: config.getOrThrow<string>('SUPABASE_URL'),
      });
      return;
    }
    if (provider === 'VERCEL_BLOB') {
      this.adapter = new VercelBlobStorageAdapter({
        access: config.getOrThrow<'private' | 'public'>('VERCEL_BLOB_ACCESS'),
        bucket,
        token: config.getOrThrow<string>('BLOB_READ_WRITE_TOKEN'),
        ttlSeconds,
      });
      return;
    }
    this.adapter = new S3StorageAdapter({
      accessKeyId: config.getOrThrow<string>('S3_KEY'),
      bucket,
      endpoint: config.get<string>('S3_ENDPOINT'),
      provider,
      region: config.getOrThrow<string>('S3_REGION'),
      secretAccessKey: config.getOrThrow<string>('S3_SECRET'),
      ttlSeconds,
    });
  }

  public get bucket(): string {
    return this.adapter.bucket;
  }

  public get provider(): StorageProvider {
    return this.adapter.provider;
  }

  public createUploadGrant(request: UploadGrantRequest): Promise<UploadGrant> {
    return this.adapter.createUploadGrant(request);
  }

  public stat(objectKey: string): Promise<StoredObjectMetadata> {
    return this.adapter.stat(objectKey);
  }

  public createDownloadGrant(objectKey: string, downloadName: string): Promise<DownloadGrant> {
    return this.adapter.createDownloadGrant(objectKey, downloadName);
  }

  public delete(objectKey: string): Promise<void> {
    return this.adapter.delete(objectKey);
  }
}
