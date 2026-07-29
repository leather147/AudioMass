import type { ProcessingJob, StorageObject } from '@audiomass/database';

export const PYTHON_OPERATIONS = [
  'analyze',
  'normalize',
  'export',
  'reverb',
  'noise-reduction',
  'plugin',
  'voice-activity',
  'transcribe',
] as const;
export type PythonOperation = (typeof PYTHON_OPERATIONS)[number];

export interface PythonRemoteObject {
  filename: string;
  headers: Record<string, string>;
  url: string;
}

export interface PythonRemoteOutput {
  content_type: string;
  headers: Record<string, string>;
  url: string;
}

export interface PythonExecutionRequest {
  input: PythonRemoteObject;
  operation: PythonOperation;
  output?: PythonRemoteOutput;
  parameters: object;
}

export interface PythonExecutionResponse {
  operation: PythonOperation;
  output_size: number | null;
  result: Record<string, unknown>;
}

export interface PythonProcessingResult {
  job: ProcessingJob;
  outputFile?: StorageObject;
  result: Record<string, unknown>;
}
