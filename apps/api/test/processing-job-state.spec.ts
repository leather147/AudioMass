import { describe, expect, it } from 'vitest';

import {
  assertJobTransition,
  InvalidJobTransitionError,
} from '../src/processing-jobs/processing-job.constants.js';

describe('processing job state machine', () => {
  it('allows the complete success path', () => {
    expect(() => assertJobTransition('QUEUED', 'RUNNING')).not.toThrow();
    expect(() => assertJobTransition('RUNNING', 'SUCCEEDED')).not.toThrow();
  });

  it('allows cancellation while work can still be stopped', () => {
    expect(() => assertJobTransition('QUEUED', 'CANCELLED')).not.toThrow();
    expect(() => assertJobTransition('RUNNING', 'CANCELLED')).not.toThrow();
  });

  it('prevents terminal jobs from being restarted', () => {
    expect(() => assertJobTransition('SUCCEEDED', 'RUNNING')).toThrow(InvalidJobTransitionError);
    expect(() => assertJobTransition('FAILED', 'QUEUED')).toThrow(
      'cannot transition from FAILED to QUEUED',
    );
  });
});
