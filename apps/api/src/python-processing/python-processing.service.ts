import type { ProcessingJobKind, StorageObject } from '@audiomass/database';
import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';

import type { FilesService } from '../files/files.service.js';
import type { ProcessingJobsService } from '../processing-jobs/processing-jobs.service.js';
import type { RunPythonOperationDto } from './dto/run-python-operation.dto.js';
import { PythonApiError, type PythonProcessingClient } from './python-processing.client.js';
import type {
  PythonExecutionRequest,
  PythonOperation,
  PythonProcessingResult,
} from './python-processing.types.js';

interface OutputDescriptor {
  contentType: string;
  fileName: string;
}

const OPERATION_JOB_KINDS: Record<PythonOperation, ProcessingJobKind> = {
  analyze: 'ANALYZE',
  normalize: 'NORMALIZE',
  export: 'MASTER',
  reverb: 'MASTER',
  'noise-reduction': 'MASTER',
  plugin: 'MASTER',
  'voice-activity': 'ANALYZE',
  transcribe: 'TRANSCRIBE',
};

@Injectable()
export class PythonProcessingService {
  public constructor(
    private readonly files: FilesService,
    private readonly jobs: ProcessingJobsService,
    private readonly python: PythonProcessingClient,
  ) {}

  public async execute(
    operation: PythonOperation,
    dto: RunPythonOperationDto,
    pluginId?: string,
  ): Promise<PythonProcessingResult> {
    const inputFile = await this.files.getReady(dto.inputFileId, dto.ownerId);
    const parameters = pluginId
      ? { parameters: dto.parameters, plugin_id: pluginId }
      : dto.parameters;
    const job = await this.jobs.create({
      idempotencyKey: dto.idempotencyKey,
      input: {
        inputFileId: inputFile.id,
        operation,
        parameters,
      },
      kind: OPERATION_JOB_KINDS[operation],
      projectId: inputFile.projectId ?? undefined,
    });
    if (job.status !== 'QUEUED') {
      return {
        job,
        result: isRecord(job.output) ? job.output : {},
      };
    }
    await this.jobs.transition(job.id, { progress: 5, status: 'RUNNING' });

    let generated: StorageObject | undefined;
    try {
      const download = await this.files.createDownloadGrant(inputFile.id, dto.ownerId);
      const outputDescriptor = this.outputDescriptor(operation, dto);
      const created = outputDescriptor
        ? await this.files.createUpload({
            contentType: outputDescriptor.contentType,
            expectedSize: this.files.maximumUploadBytes,
            fileName: outputDescriptor.fileName,
            ownerId: dto.ownerId,
            projectId: inputFile.projectId ?? undefined,
          })
        : undefined;
      generated = created?.file;
      const request: PythonExecutionRequest = {
        input: {
          filename: inputFile.originalName,
          headers: {},
          url: download.url,
        },
        operation,
        parameters,
        ...(created
          ? {
              output: {
                content_type: created.file.contentType,
                headers: created.upload.headers,
                url: created.upload.url,
              },
            }
          : {}),
      };
      const response = await this.python.execute(request);
      const outputFile = generated
        ? await this.completeGenerated(generated, dto.ownerId, response.output_size)
        : undefined;
      const result = {
        ...response.result,
        ...(outputFile ? { outputFileId: outputFile.id } : {}),
      };
      const completedJob = await this.jobs.transition(job.id, {
        output: result,
        status: 'SUCCEEDED',
      });
      return { job: completedJob, outputFile, result };
    } catch (error) {
      if (generated) await this.files.rejectPending(generated.id, dto.ownerId);
      const message = error instanceof Error ? error.message : 'Python processing failed';
      await this.jobs.transition(job.id, {
        errorCode: error instanceof PythonApiError ? 'PYTHON_API_ERROR' : 'PROCESSING_ERROR',
        errorMessage: message,
        status: 'FAILED',
      });
      throw error instanceof BadRequestException ? error : new BadGatewayException(message);
    }
  }

  private async completeGenerated(
    generated: StorageObject,
    ownerId: string,
    outputSize: number | null,
  ): Promise<StorageObject> {
    if (outputSize === null) {
      throw new PythonApiError('Python service omitted the generated output size');
    }
    return this.files.completeGenerated(generated.id, ownerId, outputSize);
  }

  private outputDescriptor(
    operation: PythonOperation,
    dto: RunPythonOperationDto,
  ): OutputDescriptor | undefined {
    if (['analyze', 'voice-activity', 'transcribe'].includes(operation)) return undefined;
    if (operation === 'export') {
      const format = dto.parameters.output_format ?? 'wav';
      if (!['flac', 'mp3', 'ogg', 'wav'].includes(String(format))) {
        throw new BadRequestException('output_format must be flac, mp3, ogg, or wav');
      }
      const contentTypes: Record<string, string> = {
        flac: 'audio/flac',
        mp3: 'audio/mpeg',
        ogg: 'audio/ogg',
        wav: 'audio/wav',
      };
      return {
        contentType: contentTypes[String(format)] ?? 'audio/wav',
        fileName: dto.outputFileName ?? `export.${String(format)}`,
      };
    }
    const defaultNames: Record<string, string> = {
      normalize: 'normalized.wav',
      'noise-reduction': 'noise-reduced.wav',
      plugin: 'plugin-output.wav',
      reverb: 'reverb.wav',
    };
    return {
      contentType: 'audio/wav',
      fileName: dto.outputFileName ?? defaultNames[operation] ?? 'processed.wav',
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
