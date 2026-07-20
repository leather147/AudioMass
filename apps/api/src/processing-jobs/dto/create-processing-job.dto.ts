import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { PROCESSING_JOB_KINDS, type ProcessingJobKindValue } from '../processing-job.constants.js';

export class CreateProcessingJobDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  public projectId?: string;

  @ApiProperty({ enum: PROCESSING_JOB_KINDS })
  @IsIn(PROCESSING_JOB_KINDS)
  public kind!: ProcessingJobKindValue;

  @ApiProperty({
    description: 'Operation-specific input and storage object references',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  public input!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Makes retries return the originally created job',
    maxLength: 128,
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  public idempotencyKey?: string;
}
