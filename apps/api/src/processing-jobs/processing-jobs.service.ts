import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Page } from '../common/pagination.dto.js';
import type { PrismaService } from '../database/prisma.service.js';
import type { Prisma, ProcessingJob } from '../generated/prisma/client.js';
import type { CreateProcessingJobDto } from './dto/create-processing-job.dto.js';
import type { ListProcessingJobsDto } from './dto/list-processing-jobs.dto.js';
import type { TransitionProcessingJobDto } from './dto/transition-processing-job.dto.js';
import { assertJobTransition, type ProcessingJobStatusValue } from './processing-job.constants.js';

@Injectable()
export class ProcessingJobsService {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(dto: CreateProcessingJobDto): Promise<ProcessingJob> {
    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        select: { id: true },
        where: { id: dto.projectId },
      });
      if (!project) {
        throw new BadRequestException(`Project ${dto.projectId} was not found`);
      }
    }

    const data: Prisma.ProcessingJobCreateInput = {
      idempotencyKey: dto.idempotencyKey,
      input: dto.input as Prisma.InputJsonValue,
      kind: dto.kind,
      ...(dto.projectId ? { project: { connect: { id: dto.projectId } } } : {}),
    };
    if (!dto.idempotencyKey) {
      return this.prisma.processingJob.create({ data });
    }
    return this.prisma.processingJob.upsert({
      create: data,
      update: {},
      where: { idempotencyKey: dto.idempotencyKey },
    });
  }

  public async list(dto: ListProcessingJobsDto): Promise<Page<ProcessingJob>> {
    const where: Prisma.ProcessingJobWhereInput = {
      ...(dto.projectId ? { projectId: dto.projectId } : {}),
      ...(dto.status ? { status: dto.status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.processingJob.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
        where,
      }),
      this.prisma.processingJob.count({ where }),
    ]);
    return { items, page: dto.page, pageSize: dto.pageSize, total };
  }

  public async get(id: string): Promise<ProcessingJob> {
    const job = await this.prisma.processingJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Processing job ${id} was not found`);
    }
    return job;
  }

  public async transition(id: string, dto: TransitionProcessingJobDto): Promise<ProcessingJob> {
    const current = await this.get(id);
    try {
      assertJobTransition(current.status as ProcessingJobStatusValue, dto.status);
    } catch (error) {
      throw new ConflictException(
        error instanceof Error ? error.message : 'Invalid job transition',
      );
    }
    this.validateTransitionPayload(dto);

    const now = new Date();
    const result = await this.prisma.processingJob.updateMany({
      data: {
        status: dto.status,
        progress: this.progressFor(dto, current.progress),
        ...(dto.output ? { output: dto.output as Prisma.InputJsonValue } : {}),
        ...(dto.errorCode ? { errorCode: dto.errorCode } : {}),
        ...(dto.errorMessage ? { errorMessage: dto.errorMessage } : {}),
        ...(dto.status === 'RUNNING' ? { startedAt: now } : {}),
        ...(['SUCCEEDED', 'FAILED', 'CANCELLED'].includes(dto.status) ? { completedAt: now } : {}),
      },
      where: { id, status: current.status },
    });
    if (result.count === 0) {
      throw new ConflictException('Processing job changed concurrently');
    }
    return this.get(id);
  }

  public cancel(id: string): Promise<ProcessingJob> {
    return this.transition(id, { status: 'CANCELLED' });
  }

  private progressFor(dto: TransitionProcessingJobDto, currentProgress: number): number {
    if (dto.status === 'SUCCEEDED') return 100;
    return dto.progress ?? currentProgress;
  }

  private validateTransitionPayload(dto: TransitionProcessingJobDto): void {
    if (dto.status === 'SUCCEEDED' && !dto.output) {
      throw new BadRequestException('A succeeded job must include output');
    }
    if (dto.status === 'FAILED' && !dto.errorMessage) {
      throw new BadRequestException('A failed job must include errorMessage');
    }
    if (dto.status !== 'FAILED' && (dto.errorCode || dto.errorMessage)) {
      throw new BadRequestException('Error fields are only valid for failed jobs');
    }
  }
}
