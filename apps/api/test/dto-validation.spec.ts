import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { UpdateProjectDto } from '../src/projects/dto/update-project.dto.js';

describe('project DTO validation', () => {
  it('requires a positive expected version', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      expectedVersion: 0,
      name: 'Edited project',
    });
    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'expectedVersion')).toBe(true);
  });

  it('accepts a serializable timeline update', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      expectedVersion: 7,
      timeline: [{ clips: [], trackId: 'track-1' }],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
