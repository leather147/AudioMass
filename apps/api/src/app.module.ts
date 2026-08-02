import { fileURLToPath } from 'node:url';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { ApiKeyGuard } from './auth/api-key.guard.js';
import { validateEnvironment } from './config/environment.js';
import { DatabaseModule } from './database/database.module.js';
import { FilesModule } from './files/files.module.js';
import { HealthModule } from './health/health.module.js';
import { ProcessingJobsModule } from './processing-jobs/processing-jobs.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { PythonProcessingModule } from './python-processing/python-processing.module.js';

const workspaceEnvironmentFile = fileURLToPath(new URL('../../../.env', import.meta.url));

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: [workspaceEnvironmentFile, '.env'],
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    HealthModule,
    FilesModule,
    ProjectsModule,
    ProcessingJobsModule,
    PythonProcessingModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ApiKeyGuard }],
})
export class AppModule {}
