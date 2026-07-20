import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import type { StorageObject } from '@audiomass/database';
import type { Page } from '../common/pagination.dto.js';
import type { DownloadGrant } from '../storage/storage.types.js';
import type { CreateUploadDto } from './dto/create-upload.dto.js';
import type { ListFilesDto } from './dto/list-files.dto.js';
import type { OwnerQueryDto } from './dto/owner-query.dto.js';
import type { FilesService } from './files.service.js';
import { type CreatedUpload } from './files.service.js';

@ApiTags('files')
@ApiSecurity('api-key')
@Controller('files')
export class FilesController {
  public constructor(private readonly files: FilesService) {}

  @Post('uploads')
  @ApiCreatedResponse({ description: 'Pending file and a short-lived direct upload grant.' })
  public createUpload(@Body() dto: CreateUploadDto): Promise<CreatedUpload> {
    return this.files.createUpload(dto);
  }

  @Post(':id/complete')
  @ApiOkResponse({ description: 'Cloud metadata verified and file marked ready.' })
  @ApiConflictResponse({ description: 'File is no longer pending.' })
  public complete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: OwnerQueryDto,
  ): Promise<StorageObject> {
    return this.files.complete(id, query.ownerId);
  }

  @Get()
  @ApiOkResponse({ description: 'Paginated cloud files for one owner.' })
  public list(@Query() dto: ListFilesDto): Promise<Page<StorageObject>> {
    return this.files.list(dto);
  }

  @Get(':id/download-url')
  @ApiOkResponse({ description: 'Short-lived direct download grant.' })
  public download(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: OwnerQueryDto,
  ): Promise<DownloadGrant> {
    return this.files.createDownloadGrant(id, query.ownerId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Cloud object removed and metadata tombstoned.' })
  public remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: OwnerQueryDto,
  ): Promise<void> {
    return this.files.remove(id, query.ownerId);
  }
}
