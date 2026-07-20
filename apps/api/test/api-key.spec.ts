import { describe, expect, it } from 'vitest';

import { isAuthorizedApiKey } from '../src/auth/api-key.guard.js';

describe('API key verification', () => {
  const primary = 'primary-key-with-more-than-32-characters';
  const rotated = 'rotated-key-with-more-than-32-characters';

  it('accepts any configured key to support rotation', () => {
    expect(isAuthorizedApiKey(rotated, [primary, rotated])).toBe(true);
  });

  it('rejects an unknown key', () => {
    expect(isAuthorizedApiKey('not-configured', [primary, rotated])).toBe(false);
  });
});
