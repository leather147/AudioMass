import { Body, Controller, Inject, Param, Post } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { RunPythonOperationDto } from './dto/run-python-operation.dto.js';
import { PythonProcessingService } from './python-processing.service.js';
import type { PythonProcessingResult } from './python-processing.types.js';

@ApiTags('python processing')
@ApiSecurity('api-key')
@ApiExtraModels(RunPythonOperationDto)
@Controller('python')
export class PythonProcessingController {
  public constructor(
    @Inject(PythonProcessingService) private readonly processing: PythonProcessingService,
  ) {}

  @Post('audio/analyze')
  @ApiOkResponse({ description: 'Audio analysis completed by the private Python service.' })
  public analyze(@Body() dto: RunPythonOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('analyze', dto);
  }

  @Post('audio/normalize')
  public normalize(@Body() dto: RunPythonOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('normalize', dto);
  }

  @Post('audio/export')
  public export(@Body() dto: RunPythonOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('export', dto);
  }

  @Post('effects/reverb')
  public reverb(@Body() dto: RunPythonOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('reverb', dto);
  }

  @Post('effects/noise-reduction')
  public noiseReduction(@Body() dto: RunPythonOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('noise-reduction', dto);
  }

  @Post('plugins/:pluginId/run')
  public runPlugin(
    @Param('pluginId') pluginId: string,
    @Body() dto: RunPythonOperationDto,
  ): Promise<PythonProcessingResult> {
    return this.processing.execute('plugin', dto, pluginId);
  }

  @Post('ai/voice-activity')
  public voiceActivity(@Body() dto: RunPythonOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('voice-activity', dto);
  }

  @Post('ai/transcribe')
  public transcribe(@Body() dto: RunPythonOperationDto): Promise<PythonProcessingResult> {
    return this.processing.execute('transcribe', dto);
  }
}
