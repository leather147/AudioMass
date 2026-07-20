import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import {
  PROCESSING_JOB_STATUSES,
  type ProcessingJobStatusValue,
} from '../processing-job.constants.js';

export class TransitionProcessingJobDto {
  @ApiProperty({ enum: PROCESSING_JOB_STATUSES })
  @IsIn(PROCESSING_JOB_STATUSES)
  public status!: ProcessingJobStatusValue;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  public progress?: number;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  public output?: Record<string, unknown>;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  public errorCode?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  public errorMessage?: string;
}
