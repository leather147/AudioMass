export const PROCESSING_JOB_KINDS = [
  'ANALYZE',
  'NORMALIZE',
  'TRANSCRIBE',
  'STEM_SEPARATION',
  'MASTER',
] as const;
export type ProcessingJobKindValue = (typeof PROCESSING_JOB_KINDS)[number];

export const PROCESSING_JOB_STATUSES = [
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
] as const;
export type ProcessingJobStatusValue = (typeof PROCESSING_JOB_STATUSES)[number];

const ALLOWED_TRANSITIONS: Readonly<
  Record<ProcessingJobStatusValue, readonly ProcessingJobStatusValue[]>
> = {
  QUEUED: ['RUNNING', 'FAILED', 'CANCELLED'],
  RUNNING: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
  SUCCEEDED: [],
  FAILED: [],
  CANCELLED: [],
};

export class InvalidJobTransitionError extends Error {
  public constructor(
    public readonly from: ProcessingJobStatusValue,
    public readonly to: ProcessingJobStatusValue,
  ) {
    super(`Processing job cannot transition from ${from} to ${to}`);
    this.name = 'InvalidJobTransitionError';
  }
}

export function assertJobTransition(
  from: ProcessingJobStatusValue,
  to: ProcessingJobStatusValue,
): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new InvalidJobTransitionError(from, to);
  }
}
