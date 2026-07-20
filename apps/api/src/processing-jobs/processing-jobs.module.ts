import { Module } from '@nestjs/common';

import { ProcessingJobsController } from './processing-jobs.controller.js';
import { ProcessingJobsService } from './processing-jobs.service.js';

@Module({
  controllers: [ProcessingJobsController],
  providers: [ProcessingJobsService],
  exports: [ProcessingJobsService],
})
export class ProcessingJobsModule {}
