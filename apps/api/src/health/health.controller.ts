import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/public.decorator.js';
import type { HealthService } from './health.service.js';
import { type HealthStatus } from './health.service.js';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  public constructor(private readonly health: HealthService) {}

  @Get('live')
  @ApiOperation({ summary: 'Process liveness probe' })
  @ApiOkResponse({ description: 'The API process is running.' })
  public live(): HealthStatus {
    return this.health.live();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Database readiness probe' })
  @ApiOkResponse({ description: 'The API and PostgreSQL are ready.' })
  public ready(): Promise<HealthStatus> {
    return this.health.ready();
  }
}
