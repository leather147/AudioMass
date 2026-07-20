import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import type { ProcessingJob } from '@audiomass/database';
import type { Page } from '../common/pagination.dto.js';
import type { CreateProcessingJobDto } from './dto/create-processing-job.dto.js';
import type { ListProcessingJobsDto } from './dto/list-processing-jobs.dto.js';
import type { TransitionProcessingJobDto } from './dto/transition-processing-job.dto.js';
import type { ProcessingJobsService } from './processing-jobs.service.js';

@ApiTags('processing jobs')
@ApiSecurity('api-key')
@Controller('processing-jobs')
export class ProcessingJobsController {
  public constructor(private readonly jobs: ProcessingJobsService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Job queued, or existing idempotent job returned.',
  })
  public create(@Body() dto: CreateProcessingJobDto): Promise<ProcessingJob> {
    return this.jobs.create(dto);
  }

  @Get()
  @ApiOkResponse({ description: 'Paginated processing jobs.' })
  public list(@Query() dto: ListProcessingJobsDto): Promise<Page<ProcessingJob>> {
    return this.jobs.list(dto);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Processing job state.' })
  public get(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProcessingJob> {
    return this.jobs.get(id);
  }

  @Patch(':id/status')
  @ApiOkResponse({ description: 'Job advanced to an allowed state.' })
  @ApiConflictResponse({ description: 'State transition is not allowed.' })
  public transition(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TransitionProcessingJobDto,
  ): Promise<ProcessingJob> {
    return this.jobs.transition(id, dto);
  }

  @Post(':id/cancel')
  @ApiOkResponse({ description: 'Queued or running job cancelled.' })
  public cancel(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProcessingJob> {
    return this.jobs.cancel(id);
  }
}
