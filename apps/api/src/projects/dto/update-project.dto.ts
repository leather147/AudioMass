import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

import { PROJECT_VISIBILITIES, type ProjectVisibilityValue } from '../project.constants.js';

export class UpdateProjectDto {
  @ApiProperty({
    description: 'Current project version used for optimistic locking',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  public expectedVersion!: number;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @Length(1, 160)
  public name?: string;

  @ApiPropertyOptional({ maxLength: 2000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  public description?: string;

  @ApiPropertyOptional({ enum: PROJECT_VISIBILITIES })
  @IsOptional()
  @IsIn(PROJECT_VISIBILITIES)
  public visibility?: ProjectVisibilityValue;

  @ApiPropertyOptional({
    description: 'Serializable AudioMass timeline document',
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  @IsOptional()
  @IsArray()
  public timeline?: unknown[];
}
