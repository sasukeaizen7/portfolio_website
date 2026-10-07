import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, Res, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminGuard } from '../auth/admin.guard';
import { ImagesService, MAX_IMAGE_BYTES } from './images.service';
import { CreateProjectDto, UpdateProfileDto, UpdateProjectDto } from './projects.dto';
import { ProjectsService } from './projects.service';

// Public, read-only: what the galaxy shows.
@Controller()
export class PublicController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly images: ImagesService,
  ) {}

  @Get('projects')
  list() {
    return this.projects.list(false);
  }

  @Get('projects/:slug')
  get(@Param('slug') slug: string) {
    return this.projects.getPublished(slug);
  }

  @Get('profile')
  profile() {
    return this.projects.getProfile();
  }

  @Get('images/:id')
  async image(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const { mime, bytes } = await this.images.get(id);
    res.set({
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=31536000, immutable', // images are never edited, only replaced
      'Content-Security-Policy': "default-src 'none'",
      'Cross-Origin-Resource-Policy': 'same-origin',
    });
    res.send(bytes);
  }
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly images: ImagesService,
  ) {}

  @Get('projects')
  list() {
    return this.projects.list(true);
  }

  @Post('projects')
  create(@Body() body: CreateProjectDto) {
    return this.projects.create(body);
  }

  @Patch('projects/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateProjectDto) {
    return this.projects.update(id, body);
  }

  @Delete('projects/:id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.remove(id);
  }

  @Put('profile')
  updateProfile(@Body() body: UpdateProfileDto) {
    return this.projects.updateProfile(body);
  }

  @Post('images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  upload(@UploadedFile() file: Express.Multer.File | undefined) {
    return this.images.save(file?.buffer);
  }
}
