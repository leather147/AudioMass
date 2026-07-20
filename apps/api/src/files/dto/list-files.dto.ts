import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { StorageObjectStatus } from '@audiomass/database';
import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

import { PaginationDto } from '../../common/pagination.dto.js';

const FILE_STATUSES = [
  'PENDING',
  'READY',
  'REJECTED',
] as const satisfies readonly StorageObjectStatus[];

export class ListFilesDto extends PaginationDto {
  @ApiProperty({ description: 'Tenant/workspace owner identifier' })
  @IsString()
  @Length(1, 120)
  public ownerId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  public projectId?: string;

  @ApiPropertyOptional({ enum: FILE_STATUSES })
  @IsOptional()
  @IsIn(FILE_STATUSES)
  public status?: (typeof FILE_STATUSES)[number];
}
