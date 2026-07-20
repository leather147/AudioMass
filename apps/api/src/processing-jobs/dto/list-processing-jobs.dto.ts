import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

import { PaginationDto } from '../../common/pagination.dto.js';
import {
  PROCESSING_JOB_STATUSES,
  type ProcessingJobStatusValue,
} from '../processing-job.constants.js';

export class ListProcessingJobsDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  public projectId?: string;

  @ApiPropertyOptional({ enum: PROCESSING_JOB_STATUSES })
  @IsOptional()
  @IsIn(PROCESSING_JOB_STATUSES)
  public status?: ProcessingJobStatusValue;
}
