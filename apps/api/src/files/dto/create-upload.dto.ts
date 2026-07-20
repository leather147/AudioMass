import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsMimeType,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateUploadDto {
  @ApiProperty({ description: 'Tenant/workspace owner identifier' })
  @IsString()
  @Length(1, 120)
  public ownerId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  public projectId?: string;

  @ApiProperty({ example: 'lead-vocal.wav', maxLength: 255 })
  @IsString()
  @Length(1, 255)
  public fileName!: string;

  @ApiProperty({ example: 'audio/wav' })
  @IsMimeType()
  public contentType!: string;

  @ApiProperty({ description: 'Exact upload length in bytes', maximum: 2_147_483_647 })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  public expectedSize!: number;

  @ApiPropertyOptional({ description: 'Lowercase SHA-256 digest' })
  @IsOptional()
  @Matches(/^[a-f0-9]{64}$/)
  public checksumSha256?: string;
}
