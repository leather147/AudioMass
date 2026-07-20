import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';

export interface HealthStatus {
  service: 'audiomass-api';
  status: 'ok';
  timestamp: string;
}

export function createLivenessStatus(now = new Date()): HealthStatus {
  return {
    service: 'audiomass-api',
    status: 'ok',
    timestamp: now.toISOString(),
  };
}

@Injectable()
export class HealthService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public live(): HealthStatus {
    return createLivenessStatus();
  }

  public async ready(): Promise<HealthStatus> {
    await this.prisma.$queryRaw`SELECT 1`;
    return createLivenessStatus();
  }
}
