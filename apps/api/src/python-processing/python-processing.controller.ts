import { Body, Controller, Inject, Param, Post } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

import {
  AnalyzeOperationDto,
  EmptyParametersDto,
  ExportOperationDto,
  ExportParametersDto,
  NoiseReductionOperationDto,
  NoiseReductionParametersDto,
  NormalizeOperationDto,
  NormalizeParametersDto,
  PluginOperationDto,
  ReverbOperationDto,
  ReverbParametersDto,
  TranscriptionOperationDto,
  TranscriptionParametersDto,
  VoiceActivityOperationDto,
  VoiceActivityParametersDto,
} from './dto/run-python-operation.dto.js';
import { PythonProcessingService } from './python-processing.service.js';
import type { PythonProcessingResult } from './python-processing.types.js';

@ApiTags('python processing')
@ApiSecurity('api-key')
@ApiExtraModels(
  AnalyzeOperationDto,
  EmptyParametersDto,
  ExportOperationDto,
  ExportParametersDto,
  NoiseReductionOperationDto,
  NoiseReductionParametersDto,
  NormalizeOperationDto,
  NormalizeParametersDto,
  PluginOperationDto,
  ReverbOperationDto,
  ReverbParametersDto,
  TranscriptionOperationDto,
  TranscriptionParametersDto,
  VoiceActivityOperationDto,
  VoiceActivityParametersDto,
)
@Controller('python')
export class PythonProcessingController {
  public constructor(
    @Inject(PythonProcessingService) private readonly processing: PythonProcessingService,
  ) {}

  @Post('audio/analyze')
  @ApiOkResponse({ description: 'Audio analysis completed by the private Python service.' })
  public analyze(@Body() dto: AnalyzeOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('analyze', dto);
  }

  @Post('audio/normalize')
  public normalize(@Body() dto: NormalizeOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('normalize', dto);
  }

  @Post('audio/export')
  public export(@Body() dto: ExportOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('export', dto);
  }

  @Post('effects/reverb')
  public reverb(@Body() dto: ReverbOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('reverb', dto);
  }

  @Post('effects/noise-reduction')
  public noiseReduction(@Body() dto: NoiseReductionOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('noise-reduction', dto);
  }

  @Post('plugins/:pluginId/run')
  public runPlugin(
    @Param('pluginId') pluginId: string,
    @Body() dto: PluginOperationDto,
  ): Promise<PythonProcessingResult> {
    return this.processing.execute('plugin', dto, pluginId);
  }

  @Post('ai/voice-activity')
  public voiceActivity(@Body() dto: VoiceActivityOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('voice-activity', dto);
  }

  @Post('ai/transcribe')
  public transcribe(@Body() dto: TranscriptionOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('transcribe', dto);
  }
}
