import { Module } from '@nestjs/common';

import { CloudStorageService } from '../storage/cloud-storage.service.js';
import { FilesController } from './files.controller.js';
import { FilesService } from './files.service.js';

@Module({
  controllers: [FilesController],
  exports: [FilesService],
  providers: [CloudStorageService, FilesService],
})
export class FilesModule {}
