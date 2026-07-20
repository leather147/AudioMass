import type { StorageObject } from '@audiomass/database';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';

import type { Page } from '../common/pagination.dto.js';
import type { PrismaService } from '../database/prisma.service.js';
import type { CloudStorageService } from '../storage/cloud-storage.service.js';
import {
  CloudObjectNotFoundError,
  CloudStorageUnavailableError,
  type DownloadGrant,
  type UploadGrant,
} from '../storage/storage.types.js';
import { createStorageObjectKey } from '../storage/storage-key.js';
import type { CreateUploadDto } from './dto/create-upload.dto.js';
import type { ListFilesDto } from './dto/list-files.dto.js';
import { validateStoredObject } from './storage-object.validation.js';

export interface CreatedUpload {
  file: StorageObject;
  upload: UploadGrant;
}

@Injectable()
export class FilesService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly storage: CloudStorageService,
  ) {}

  public async createUpload(dto: CreateUploadDto): Promise<CreatedUpload> {
    if (dto.expectedSize > this.storage.maxUploadBytes) {
      throw new BadRequestException(`Upload exceeds ${this.storage.maxUploadBytes} bytes`);
    }
    if (dto.projectId) await this.assertOwnedProject(dto.projectId, dto.ownerId);

    const objectKey = createStorageObjectKey(dto.ownerId, dto.fileName);
    const file = await this.prisma.storageObject.create({
      data: {
        bucket: this.storage.bucket,
        checksumSha256: dto.checksumSha256,
        contentType: dto.contentType,
        expectedSize: dto.expectedSize,
        objectKey,
        originalName: dto.fileName,
        ownerId: dto.ownerId,
        projectId: dto.projectId,
        provider: this.storage.provider,
      },
    });
    try {
      const upload = await this.storage.createUploadGrant({
        contentType: file.contentType,
        expectedSize: file.expectedSize,
        objectKey: file.objectKey,
      });
      return { file, upload };
    } catch (error) {
      await this.prisma.storageObject.update({
        data: { status: 'REJECTED' },
        where: { id: file.id },
      });
      throw this.toHttpException(error);
    }
  }

  public async complete(id: string, ownerId: string): Promise<StorageObject> {
    const file = await this.getOwned(id, ownerId);
    if (file.status === 'READY') return file;
    if (file.status !== 'PENDING') {
      throw new ConflictException(`File ${id} cannot be completed from ${file.status}`);
    }

    let metadata;
    try {
      metadata = await this.storage.stat(file.objectKey);
    } catch (error) {
      throw this.toHttpException(error);
    }
    const validationErrors = validateStoredObject(file.expectedSize, file.contentType, metadata);
    if (validationErrors.length > 0) {
      await this.prisma.storageObject.update({
        data: { actualSize: metadata.size, status: 'REJECTED' },
        where: { id: file.id },
      });
      try {
        await this.storage.delete(file.objectKey);
      } catch (error) {
        throw this.toHttpException(error);
      }
      throw new UnprocessableEntityException(validationErrors.join('; '));
    }

    const update = await this.prisma.storageObject.updateMany({
      data: {
        actualSize: metadata.size,
        etag: metadata.etag,
        externalUrl: metadata.externalUrl,
        status: 'READY',
      },
      where: { id: file.id, status: 'PENDING' },
    });
    if (update.count === 0) throw new ConflictException('File changed concurrently');
    return this.getOwned(id, ownerId);
  }

  public async list(dto: ListFilesDto): Promise<Page<StorageObject>> {
    const where = {
      ownerId: dto.ownerId,
      status: dto.status ?? { not: 'DELETED' as const },
      ...(dto.projectId ? { projectId: dto.projectId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.storageObject.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
        where,
      }),
      this.prisma.storageObject.count({ where }),
    ]);
    return { items, page: dto.page, pageSize: dto.pageSize, total };
  }

  public async createDownloadGrant(id: string, ownerId: string): Promise<DownloadGrant> {
    const file = await this.getOwned(id, ownerId);
    if (file.status !== 'READY') throw new ConflictException('File is not ready for download');
    try {
      return await this.storage.createDownloadGrant(file.objectKey, file.originalName);
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  public async remove(id: string, ownerId: string): Promise<void> {
    const file = await this.getOwned(id, ownerId);
    if (file.status === 'DELETED') return;
    try {
      await this.storage.delete(file.objectKey);
    } catch (error) {
      throw this.toHttpException(error);
    }
    await this.prisma.storageObject.update({
      data: { deletedAt: new Date(), status: 'DELETED' },
      where: { id: file.id },
    });
  }

  private async assertOwnedProject(projectId: string, ownerId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({
      select: { id: true },
      where: { id: projectId, ownerId },
    });
    if (!project)
      throw new BadRequestException(`Project ${projectId} was not found for this owner`);
  }

  private async getOwned(id: string, ownerId: string): Promise<StorageObject> {
    const file = await this.prisma.storageObject.findFirst({ where: { id, ownerId } });
    if (!file) throw new NotFoundException(`File ${id} was not found`);
    return file;
  }

  private toHttpException(error: unknown): Error {
    if (error instanceof CloudObjectNotFoundError) return new NotFoundException(error.message);
    if (error instanceof CloudStorageUnavailableError) {
      return new ServiceUnavailableException(error.message);
    }
    return error instanceof Error ? error : new ServiceUnavailableException('Cloud storage failed');
  }
}
