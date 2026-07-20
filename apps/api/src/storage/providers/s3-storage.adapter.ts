import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageProvider } from '@audiomass/database';

import {
  CloudObjectNotFoundError,
  CloudStorageUnavailableError,
  type CloudStorageAdapter,
  type DownloadGrant,
  type StoredObjectMetadata,
  type UploadGrant,
  type UploadGrantRequest,
} from '../storage.types.js';

export interface S3StorageOptions {
  accessKeyId: string;
  bucket: string;
  endpoint?: string;
  provider: Extract<StorageProvider, 'S3' | 'MINIO'>;
  region: string;
  secretAccessKey: string;
  ttlSeconds: number;
}

export class S3StorageAdapter implements CloudStorageAdapter {
  public readonly bucket: string;
  public readonly provider: Extract<StorageProvider, 'S3' | 'MINIO'>;
  private readonly client: S3Client;
  private readonly ttlSeconds: number;

  public constructor(options: S3StorageOptions) {
    this.bucket = options.bucket;
    this.provider = options.provider;
    this.ttlSeconds = options.ttlSeconds;
    this.client = new S3Client({
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      endpoint: options.endpoint,
      forcePathStyle: options.provider === 'MINIO',
      region: options.region,
    });
  }

  public async createUploadGrant(request: UploadGrantRequest): Promise<UploadGrant> {
    const serverSideEncryption = this.provider === 'S3' ? 'AES256' : undefined;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      ContentType: request.contentType,
      Key: request.objectKey,
      ServerSideEncryption: serverSideEncryption,
    });
    try {
      const url = await getSignedUrl(this.client, command, { expiresIn: this.ttlSeconds });
      return {
        expiresAt: this.expiresAt(),
        headers: {
          'content-type': request.contentType,
          ...(serverSideEncryption ? { 'x-amz-server-side-encryption': serverSideEncryption } : {}),
        },
        method: 'PUT',
        strategy: 'presigned-put',
        url,
      };
    } catch (error) {
      throw new CloudStorageUnavailableError(this.provider, 'create upload grant', error);
    }
  }

  public async stat(objectKey: string): Promise<StoredObjectMetadata> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      );
      return {
        contentType: result.ContentType ?? 'application/octet-stream',
        etag: result.ETag,
        size: result.ContentLength ?? 0,
      };
    } catch (error) {
      if (error instanceof NotFound) throw new CloudObjectNotFoundError(objectKey);
      throw new CloudStorageUnavailableError(this.provider, 'read object metadata', error);
    }
  }

  public async createDownloadGrant(
    objectKey: string,
    downloadName: string,
  ): Promise<DownloadGrant> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
      });
      return {
        expiresAt: this.expiresAt(),
        url: await getSignedUrl(this.client, command, { expiresIn: this.ttlSeconds }),
      };
    } catch (error) {
      throw new CloudStorageUnavailableError(this.provider, 'create download grant', error);
    }
  }

  public async delete(objectKey: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
    } catch (error) {
      throw new CloudStorageUnavailableError(this.provider, 'delete object', error);
    }
  }

  private expiresAt(): string {
    return new Date(Date.now() + this.ttlSeconds * 1_000).toISOString();
  }
}
