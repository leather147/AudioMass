import type { StorageProvider } from '@audiomass/database';
import { BlobNotFoundError, del, head, issueSignedToken, presignUrl } from '@vercel/blob';

import {
  CloudObjectNotFoundError,
  CloudStorageUnavailableError,
  type CloudStorageAdapter,
  type DownloadGrant,
  type StoredObjectMetadata,
  type UploadGrant,
  type UploadGrantRequest,
} from '../storage.types.js';

export interface VercelBlobStorageOptions {
  access: 'private' | 'public';
  bucket: string;
  token: string;
  ttlSeconds: number;
}

export class VercelBlobStorageAdapter implements CloudStorageAdapter {
  public readonly provider: StorageProvider = 'VERCEL_BLOB';
  public readonly bucket: string;
  private readonly access: 'private' | 'public';
  private readonly token: string;
  private readonly ttlSeconds: number;

  public constructor(options: VercelBlobStorageOptions) {
    this.access = options.access;
    this.bucket = options.bucket;
    this.token = options.token;
    this.ttlSeconds = options.ttlSeconds;
  }

  public async createUploadGrant(request: UploadGrantRequest): Promise<UploadGrant> {
    const validUntil = Date.now() + this.ttlSeconds * 1_000;
    try {
      const signedToken = await issueSignedToken({
        allowedContentTypes: [request.contentType],
        maximumSizeInBytes: request.expectedSize,
        operations: ['put'],
        pathname: request.objectKey,
        token: this.token,
        validUntil,
      });
      const { presignedUrl } = await presignUrl(signedToken, {
        access: this.access,
        addRandomSuffix: false,
        allowedContentTypes: [request.contentType],
        allowOverwrite: false,
        maximumSizeInBytes: request.expectedSize,
        operation: 'put',
        pathname: request.objectKey,
        validUntil,
      });
      return {
        expiresAt: new Date(validUntil).toISOString(),
        headers: { 'content-type': request.contentType },
        method: 'PUT',
        strategy: 'presigned-put',
        url: presignedUrl,
      };
    } catch (error) {
      throw new CloudStorageUnavailableError(this.provider, 'create upload grant', error);
    }
  }

  public async stat(objectKey: string): Promise<StoredObjectMetadata> {
    try {
      const result = await head(objectKey, { token: this.token });
      return {
        contentType: result.contentType,
        etag: result.etag,
        externalUrl: result.url,
        size: result.size,
      };
    } catch (error) {
      if (error instanceof BlobNotFoundError) throw new CloudObjectNotFoundError(objectKey);
      throw new CloudStorageUnavailableError(this.provider, 'read object metadata', error);
    }
  }

  public async createDownloadGrant(
    objectKey: string,
    _downloadName: string,
  ): Promise<DownloadGrant> {
    const validUntil = Date.now() + this.ttlSeconds * 1_000;
    try {
      const signedToken = await issueSignedToken({
        operations: ['get'],
        pathname: objectKey,
        token: this.token,
        validUntil,
      });
      const { presignedUrl } = await presignUrl(signedToken, {
        access: this.access,
        operation: 'get',
        pathname: objectKey,
        validUntil,
      });
      return { expiresAt: new Date(validUntil).toISOString(), url: presignedUrl };
    } catch (error) {
      throw new CloudStorageUnavailableError(this.provider, 'create download grant', error);
    }
  }

  public async delete(objectKey: string): Promise<void> {
    try {
      await del(objectKey, { token: this.token });
    } catch (error) {
      throw new CloudStorageUnavailableError(this.provider, 'delete object', error);
    }
  }
}
