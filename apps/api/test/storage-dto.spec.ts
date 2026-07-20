import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateUploadDto } from '../src/files/dto/create-upload.dto.js';

describe('storage DTO validation', () => {
  it('accepts a bounded audio upload declaration', async () => {
    const dto = plainToInstance(CreateUploadDto, {
      contentType: 'audio/wav',
      expectedSize: 4096,
      fileName: 'voice.wav',
      ownerId: 'workspace_8f147',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid MIME types, lengths, and checksums', async () => {
    const dto = plainToInstance(CreateUploadDto, {
      checksumSha256: 'not-a-digest',
      contentType: 'wav',
      expectedSize: 0,
      fileName: '',
      ownerId: '',
    });
    const properties = (await validate(dto)).map((error) => error.property);
    expect(properties).toEqual(
      expect.arrayContaining([
        'checksumSha256',
        'contentType',
        'expectedSize',
        'fileName',
        'ownerId',
      ]),
    );
  });
});
