import { Module } from '@nestjs/common';

import { FilesModule } from '../files/files.module.js';
import { ProcessingJobsModule } from '../processing-jobs/processing-jobs.module.js';
import { PythonProcessingClient } from './python-processing.client.js';
import { PythonProcessingController } from './python-processing.controller.js';
import { PythonProcessingService } from './python-processing.service.js';

@Module({
  controllers: [PythonProcessingController],
  imports: [FilesModule, ProcessingJobsModule],
  providers: [PythonProcessingClient, PythonProcessingService],
})
export class PythonProcessingModule {}
