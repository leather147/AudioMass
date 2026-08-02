import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../src/database/prisma.service.js';
import { ProjectsService } from '../src/projects/projects.service.js';

function createHarness() {
  const project = {
    delete: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  };
  const service = new ProjectsService({ project } as unknown as PrismaService);
  return { project, service };
}

describe('ProjectsService owner isolation', () => {
  const id = 'ca1ac535-2a0d-4f52-b8cc-a26b5637a9ed';
  const ownerId = 'workspace-a';

  it('reads a project only through its owner scope', async () => {
    const { project, service } = createHarness();
    const stored = { id, ownerId };
    project.findFirst.mockResolvedValue(stored);

    await expect(service.get(id, ownerId)).resolves.toBe(stored);
    expect(project.findFirst).toHaveBeenCalledWith({ where: { id, ownerId } });
  });

  it('does not expose a project that belongs to another owner', async () => {
    const { project, service } = createHarness();
    project.findFirst.mockResolvedValue(null);

    await expect(service.get(id, ownerId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('includes the owner and expected version in an optimistic update', async () => {
    const { project, service } = createHarness();
    const stored = { id, name: 'Renamed', ownerId, version: 4 };
    project.updateMany.mockResolvedValue({ count: 1 });
    project.findFirst.mockResolvedValue(stored);

    await expect(
      service.update(id, ownerId, { expectedVersion: 3, name: 'Renamed' }),
    ).resolves.toBe(stored);
    expect(project.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id, ownerId, version: 3 } }),
    );
  });
});
