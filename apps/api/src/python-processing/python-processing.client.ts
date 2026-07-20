import { Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type {
  PythonExecutionRequest,
  PythonExecutionResponse,
  PythonOperation,
} from './python-processing.types.js';

export class PythonApiError extends Error {
  public constructor(
    message: string,
    public readonly statusCode?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'PythonApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseResponse(
  value: unknown,
  expectedOperation: PythonOperation,
): PythonExecutionResponse {
  if (!isRecord(value) || value.operation !== expectedOperation || !isRecord(value.result)) {
    throw new PythonApiError('Python service returned an invalid response');
  }
  const outputSize = value.output_size;
  let parsedOutputSize: number | null;
  if (outputSize === null) {
    parsedOutputSize = null;
  } else if (typeof outputSize === 'number') {
    parsedOutputSize = outputSize;
  } else {
    throw new PythonApiError('Python service returned an invalid output size');
  }
  return {
    operation: expectedOperation,
    output_size: parsedOutputSize,
    result: value.result,
  };
}

@Injectable()
export class PythonProcessingClient {
  private readonly baseUrl: string;
  private readonly internalKey: string;
  private readonly timeoutMs: number;

  public constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('PYTHON_API_URL').replace(/\/$/, '');
    this.internalKey = config.getOrThrow<string>('PYTHON_API_INTERNAL_KEY');
    this.timeoutMs = config.getOrThrow<number>('PYTHON_API_TIMEOUT_MS');
  }

  public async execute(request: PythonExecutionRequest): Promise<PythonExecutionResponse> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/v1/jobs/execute`, {
        body: JSON.stringify(request),
        headers: {
          'content-type': 'application/json',
          'x-internal-api-key': this.internalKey,
        },
        method: 'POST',
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new PythonApiError('Python processing service is unavailable', undefined, {
        cause: error,
      });
    }
    if (!response.ok) {
      throw new PythonApiError(
        `Python processing failed with HTTP ${response.status}`,
        response.status,
      );
    }
    return parseResponse(await response.json(), request.operation);
  }
}
