import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import {
  NormalizeOperationDto,
  RunPythonOperationDto,
  TranscriptionOperationDto,
} from '../src/python-processing/dto/run-python-operation.dto.js';

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

  it('validates operation-specific nested parameter ranges', async () => {
    const normalize = plainToInstance(NormalizeOperationDto, {
      inputFileId: 'b8310524-81e3-481e-aea4-0db7a60d4588',
      ownerId: 'workspace_8f147',
      parameters: { target_peak_dbfs: 3 },
    });
    const [error] = await validate(normalize);
    expect(error?.property).toBe('parameters');
    expect(error?.children?.[0]?.property).toBe('target_peak_dbfs');

    const transcription = plainToInstance(TranscriptionOperationDto, {
      inputFileId: 'b8310524-81e3-481e-aea4-0db7a60d4588',
      ownerId: 'workspace_8f147',
      parameters: { language: 'en', task: 'translate' },
    });
    await expect(validate(transcription)).resolves.toHaveLength(0);
  });
});
