import type { StorageProvider } from '@audiomass/database';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import {
  CloudObjectNotFoundError,
  CloudStorageUnavailableError,
  type CloudStorageAdapter,
  type DownloadGrant,
  type StoredObjectMetadata,
  type UploadGrant,
  type UploadGrantRequest,
} from '../storage.types.js';

export interface SupabaseStorageOptions {
  bucket: string;
  serviceRoleKey: string;
  ttlSeconds: number;
  url: string;
}

export class SupabaseStorageAdapter implements CloudStorageAdapter {
  public readonly provider: StorageProvider = 'SUPABASE';
  public readonly bucket: string;
  private readonly client: SupabaseClient;
  private readonly ttlSeconds: number;

  public constructor(options: SupabaseStorageOptions) {
    this.bucket = options.bucket;
    this.ttlSeconds = options.ttlSeconds;
    this.client = createClient(options.url, options.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  public async createUploadGrant(request: UploadGrantRequest): Promise<UploadGrant> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(request.objectKey, { upsert: false });
    if (error) {
      throw new CloudStorageUnavailableError(this.provider, 'create upload grant', error);
    }
    return {
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1_000).toISOString(),
      headers: { 'content-type': request.contentType },
      method: 'PUT',
      strategy: 'presigned-put',
      url: data.signedUrl,
    };
  }

  public async stat(objectKey: string): Promise<StoredObjectMetadata> {
    const { data, error } = await this.client.storage.from(this.bucket).info(objectKey);
    if (error) {
      if (error.statusCode === '404') throw new CloudObjectNotFoundError(objectKey);
      throw new CloudStorageUnavailableError(this.provider, 'read object metadata', error);
    }
    return {
      contentType: data.contentType ?? 'application/octet-stream',
      etag: data.etag,
      size: data.size ?? 0,
    };
  }

  public async createDownloadGrant(
    objectKey: string,
    downloadName: string,
  ): Promise<DownloadGrant> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(objectKey, this.ttlSeconds, { download: downloadName });
    if (error) {
      throw new CloudStorageUnavailableError(this.provider, 'create download grant', error);
    }
    return {
      expiresAt: new Date(Date.now() + this.ttlSeconds * 1_000).toISOString(),
      url: data.signedUrl,
    };
  }

  public async delete(objectKey: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([objectKey]);
    if (error) throw new CloudStorageUnavailableError(this.provider, 'delete object', error);
  }
}
