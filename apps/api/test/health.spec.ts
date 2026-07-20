import { describe, expect, it } from 'vitest';

import { createLivenessStatus } from '../src/health/health.service.js';

describe('liveness status', () => {
  it('is deterministic for the supplied clock', () => {
    expect(createLivenessStatus(new Date('2026-07-20T12:00:00.000Z'))).toEqual({
      service: 'audiomass-api',
      status: 'ok',
      timestamp: '2026-07-20T12:00:00.000Z',
    });
  });
});
