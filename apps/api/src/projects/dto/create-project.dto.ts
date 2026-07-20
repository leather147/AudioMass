import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';

import { PROJECT_VISIBILITIES, type ProjectVisibilityValue } from '../project.constants.js';

export class CreateProjectDto {
  @ApiProperty({ example: 'Podcast episode 12', maxLength: 160 })
  @IsString()
  @Length(1, 160)
  public name!: string;

  @ApiProperty({ example: 'workspace_8f147' })
  @IsString()
  @Length(1, 120)
  public ownerId!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  public description?: string;

  @ApiPropertyOptional({ enum: PROJECT_VISIBILITIES, default: 'PRIVATE' })
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
