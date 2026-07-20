import type { StorageProvider } from '@audiomass/database';

export interface UploadGrantRequest {
  contentType: string;
  expectedSize: number;
  objectKey: string;
}

export interface UploadGrant {
  expiresAt: string;
  headers: Record<string, string>;
  method: 'PUT';
  strategy: 'presigned-put';
  url: string;
}

export interface StoredObjectMetadata {
  contentType: string;
  etag?: string;
  externalUrl?: string;
  size: number;
}

export interface DownloadGrant {
  expiresAt: string;
  url: string;
}

export interface CloudStorageAdapter {
  readonly bucket: string;
  readonly provider: StorageProvider;
  createDownloadGrant(objectKey: string, downloadName: string): Promise<DownloadGrant>;
  createUploadGrant(request: UploadGrantRequest): Promise<UploadGrant>;
  delete(objectKey: string): Promise<void>;
  stat(objectKey: string): Promise<StoredObjectMetadata>;
}

export class CloudObjectNotFoundError extends Error {
  public constructor(objectKey: string) {
    super(`Cloud object ${objectKey} was not found`);
    this.name = 'CloudObjectNotFoundError';
  }
}

export class CloudStorageUnavailableError extends Error {
  public constructor(provider: string, operation: string, cause?: unknown) {
    super(`${provider} storage failed during ${operation}`, { cause });
    this.name = 'CloudStorageUnavailableError';
  }
}
