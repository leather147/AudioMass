import { describe, expect, it } from 'vitest';

import { createPostgresAdapter } from '../src/index.js';

describe('PostgreSQL adapter factory', () => {
  it('creates an adapter without opening a connection eagerly', () => {
    const adapter = createPostgresAdapter('postgresql://user:secret@localhost:5432/audiomass', {
      max: 4,
    });

    expect(adapter.provider).toBe('postgres');
  });
});
