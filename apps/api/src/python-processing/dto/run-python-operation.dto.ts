import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RunPythonOperationDto<Parameters extends object = object> {
  @ApiProperty({ description: 'Tenant/workspace owner identifier' })
  @IsString()
  @Length(1, 120)
  public ownerId!: string;

  @ApiProperty({ format: 'uuid', description: 'Ready cloud file to process' })
  @IsUUID()
  public inputFileId!: string;

  @ApiPropertyOptional({ additionalProperties: true, type: 'object' })
  @IsOptional()
  @IsObject()
  public parameters: Parameters = {} as Parameters;

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

export class EmptyParametersDto {}

export class NormalizeParametersDto {
  @ApiPropertyOptional({ default: -1, maximum: 0, minimum: -20 })
  @IsNumber()
  @Min(-20)
  @Max(0)
  public target_peak_dbfs = -1;
}

export class ExportParametersDto {
  @ApiPropertyOptional({ default: 'wav', enum: ['flac', 'mp3', 'ogg', 'wav'] })
  @IsIn(['flac', 'mp3', 'ogg', 'wav'])
  public output_format: 'flac' | 'mp3' | 'ogg' | 'wav' = 'wav';
}

export class ReverbParametersDto {
  @ApiPropertyOptional({ default: 0.5, maximum: 1, minimum: 0 })
  @IsNumber()
  @Min(0)
  @Max(1)
  public room_size = 0.5;

  @ApiPropertyOptional({ default: 0.5, maximum: 1, minimum: 0 })
  @IsNumber()
  @Min(0)
  @Max(1)
  public damping = 0.5;

  @ApiPropertyOptional({ default: 0.25, maximum: 1, minimum: 0 })
  @IsNumber()
  @Min(0)
  @Max(1)
  public wet = 0.25;
}

export class NoiseReductionParametersDto {
  @ApiPropertyOptional({ default: 0.65, maximum: 1, minimum: 0 })
  @IsNumber()
  @Min(0)
  @Max(1)
  public strength = 0.65;
}

export class VoiceActivityParametersDto {
  @ApiPropertyOptional({ default: 0.5, maximum: 1, minimum: 0 })
  @IsNumber()
  @Min(0)
  @Max(1)
  public sensitivity = 0.5;
}

export class TranscriptionParametersDto {
  @ApiPropertyOptional({ maxLength: 16, minLength: 2, nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 16)
  public language: string | null = null;

  @ApiPropertyOptional({ default: 'transcribe', enum: ['transcribe', 'translate'] })
  @IsIn(['transcribe', 'translate'])
  public task: 'transcribe' | 'translate' = 'transcribe';
}

export class AnalyzeOperationDto extends RunPythonOperationDto<EmptyParametersDto> {
  @ApiPropertyOptional({ type: EmptyParametersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmptyParametersDto)
  public override parameters = new EmptyParametersDto();
}

export class NormalizeOperationDto extends RunPythonOperationDto<NormalizeParametersDto> {
  @ApiPropertyOptional({ type: NormalizeParametersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NormalizeParametersDto)
  public override parameters = new NormalizeParametersDto();
}

export class ExportOperationDto extends RunPythonOperationDto<ExportParametersDto> {
  @ApiPropertyOptional({ type: ExportParametersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExportParametersDto)
  public override parameters = new ExportParametersDto();
}

export class ReverbOperationDto extends RunPythonOperationDto<ReverbParametersDto> {
  @ApiPropertyOptional({ type: ReverbParametersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReverbParametersDto)
  public override parameters = new ReverbParametersDto();
}

export class NoiseReductionOperationDto extends RunPythonOperationDto<NoiseReductionParametersDto> {
  @ApiPropertyOptional({ type: NoiseReductionParametersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NoiseReductionParametersDto)
  public override parameters = new NoiseReductionParametersDto();
}

export class VoiceActivityOperationDto extends RunPythonOperationDto<VoiceActivityParametersDto> {
  @ApiPropertyOptional({ type: VoiceActivityParametersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VoiceActivityParametersDto)
  public override parameters = new VoiceActivityParametersDto();
}

export class TranscriptionOperationDto extends RunPythonOperationDto<TranscriptionParametersDto> {
  @ApiPropertyOptional({ type: TranscriptionParametersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranscriptionParametersDto)
  public override parameters = new TranscriptionParametersDto();
}

export class PluginOperationDto extends RunPythonOperationDto<Record<string, unknown>> {
  @ApiPropertyOptional({ additionalProperties: true, type: 'object' })
  @IsOptional()
  @IsObject()
  public override parameters: Record<string, unknown> = {};
}
