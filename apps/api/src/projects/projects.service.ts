import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, Project } from '@audiomass/database';

import type { Page } from '../common/pagination.dto.js';
import type { PrismaService } from '../database/prisma.service.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
import type { ListProjectsDto } from './dto/list-projects.dto.js';
import type { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  public constructor(private readonly prisma: PrismaService) {}

  public create(dto: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({
      data: {
        description: dto.description,
        name: dto.name,
        ownerId: dto.ownerId,
        timeline: (dto.timeline ?? []) as Prisma.InputJsonValue,
        visibility: dto.visibility ?? 'PRIVATE',
      },
    });
  }

  public async list(dto: ListProjectsDto): Promise<Page<Project>> {
    const where: Prisma.ProjectWhereInput = {
      ownerId: dto.ownerId,
      ...(dto.search ? { name: { contains: dto.search, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        orderBy: { updatedAt: 'desc' },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
        where,
      }),
      this.prisma.project.count({ where }),
    ]);
    return { items, page: dto.page, pageSize: dto.pageSize, total };
  }

  public async get(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} was not found`);
    return project;
  }

  public async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const data: Prisma.ProjectUpdateManyMutationInput = {
      version: { increment: 1 },
      ...(dto.name === undefined ? {} : { name: dto.name }),
      ...(dto.description === undefined ? {} : { description: dto.description }),
      ...(dto.visibility === undefined ? {} : { visibility: dto.visibility }),
      ...(dto.timeline === undefined ? {} : { timeline: dto.timeline as Prisma.InputJsonValue }),
    };
    const result = await this.prisma.project.updateMany({
      data,
      where: { id, version: dto.expectedVersion },
    });
    if (result.count === 0) {
      const exists = await this.prisma.project.findUnique({
        select: { id: true },
        where: { id },
      });
      if (!exists) throw new NotFoundException(`Project ${id} was not found`);
      throw new ConflictException('Project was updated by another client; reload and retry');
    }
    return this.get(id);
  }

  public async remove(id: string): Promise<void> {
    await this.get(id);
    await this.prisma.project.delete({ where: { id } });
  }
}
