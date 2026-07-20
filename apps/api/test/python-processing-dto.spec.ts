import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { RunPythonOperationDto } from '../src/python-processing/dto/run-python-operation.dto.js';

describe('Python operation DTO', () => {
  it('accepts storage references and bounded parameters', async () => {
    const dto = plainToInstance(RunPythonOperationDto, {
      inputFileId: 'b8310524-81e3-481e-aea4-0db7a60d4588',
      ownerId: 'workspace_8f147',
      parameters: { target_peak_dbfs: -2 },
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects raw paths and invalid file references', async () => {
    const dto = plainToInstance(RunPythonOperationDto, {
      inputFileId: 'C:\\private\\input.wav',
      ownerId: '',
      parameters: 'not-an-object',
    });
    const properties = (await validate(dto)).map((error) => error.property);
    expect(properties).toEqual(expect.arrayContaining(['inputFileId', 'ownerId', 'parameters']));
  });
});
