import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

import { PaginationDto } from '../../common/pagination.dto.js';

export class ListProjectsDto extends PaginationDto {
  @ApiProperty({ description: 'Tenant/workspace owner identifier' })
  @IsString()
  @Length(1, 120)
  public ownerId!: string;

  @ApiPropertyOptional({ description: 'Case-insensitive name search' })
  @IsOptional()
  @IsString()
  @Length(1, 160)
  public search?: string;
}
