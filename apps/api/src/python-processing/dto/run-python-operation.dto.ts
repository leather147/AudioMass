import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export class RunPythonOperationDto {
  @ApiProperty({ description: 'Tenant/workspace owner identifier' })
  @IsString()
  @Length(1, 120)
  public ownerId!: string;

  @ApiProperty({ format: 'uuid', description: 'Ready cloud file to process' })
  @IsUUID()
  public inputFileId!: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  public parameters: Record<string, unknown> = {};

  @ApiPropertyOptional({ maxLength: 255, description: 'Download name for generated audio' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  public outputFileName?: string;

  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  public idempotencyKey?: string;
}
