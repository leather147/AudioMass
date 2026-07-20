import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import type { Page } from '../common/pagination.dto.js';
import type { Project } from '../generated/prisma/client.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
import type { ListProjectsDto } from './dto/list-projects.dto.js';
import type { UpdateProjectDto } from './dto/update-project.dto.js';
import type { ProjectsService } from './projects.service.js';

@ApiTags('projects')
@ApiSecurity('api-key')
@Controller('projects')
export class ProjectsController {
  public constructor(private readonly projects: ProjectsService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Project created.' })
  public create(@Body() dto: CreateProjectDto): Promise<Project> {
    return this.projects.create(dto);
  }

  @Get()
  @ApiOkResponse({ description: 'Paginated projects for one owner.' })
  public list(@Query() dto: ListProjectsDto): Promise<Page<Project>> {
    return this.projects.list(dto);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Project document.' })
  @ApiNotFoundResponse({ description: 'Project does not exist.' })
  public get(@Param('id', new ParseUUIDPipe()) id: string): Promise<Project> {
    return this.projects.get(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Project updated and version incremented.' })
  @ApiConflictResponse({ description: 'The supplied version is stale.' })
  public update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projects.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Project deleted.' })
  public remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.projects.remove(id);
  }
}
