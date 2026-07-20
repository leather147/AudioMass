import { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PythonProcessingClient } from '../src/python-processing/python-processing.client.js';

function client(): PythonProcessingClient {
  return new PythonProcessingClient(
    new ConfigService({
      PYTHON_API_INTERNAL_KEY: 'p'.repeat(32),
      PYTHON_API_TIMEOUT_MS: 60_000,
      PYTHON_API_URL: 'http://python-api:8000/',
    }),
  );
}

afterEach(() => vi.restoreAllMocks());

describe('Python processing client', () => {
  it('authenticates the private request and validates the response envelope', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          operation: 'analyze',
          output_size: null,
          result: { levels: { peak_dbfs: -1 } },
        }),
        { headers: { 'content-type': 'application/json' }, status: 200 },
      ),
    );

    const response = await client().execute({
      input: { filename: 'input.wav', headers: {}, url: 'https://storage/input.wav' },
      operation: 'analyze',
      parameters: {},
    });

    expect(response.result).toEqual({ levels: { peak_dbfs: -1 } });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://python-api:8000/v1/jobs/execute',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-internal-api-key': 'p'.repeat(32) }),
        method: 'POST',
      }),
    );
  });

  it('rejects upstream failures and malformed success responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 503 }));
    await expect(
      client().execute({
        input: { filename: 'input.wav', headers: {}, url: 'https://storage/input.wav' },
        operation: 'analyze',
        parameters: {},
      }),
    ).rejects.toMatchObject({ statusCode: 503 });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ operation: 'analyze', result: [] }), { status: 200 }),
    );
    await expect(
      client().execute({
        input: { filename: 'input.wav', headers: {}, url: 'https://storage/input.wav' },
        operation: 'analyze',
        parameters: {},
      }),
    ).rejects.toThrow('invalid response');
  });
});
