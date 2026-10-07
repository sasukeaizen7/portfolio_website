import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, Res, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminGuard } from '../auth/admin.guard';
import { ContentService } from './content.service';
import { ImagesService, MAX_IMAGE_BYTES } from './images.service';
import {
  CreateExperienceDto, CreateProjectDto, CreateSkillGroupDto, UpdateExperienceDto, UpdateProfileDto, UpdateProjectDto, UpdateSkillGroupDto,
} from './projects.dto';
import { ProjectsService } from './projects.service';

const UPLOAD = FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } });

// Public, read-only: what the site shows.
@Controller()
export class PublicController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly content: ContentService,
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

  @Get('experiences')
  experiences() {
    return this.content.listExperiences(false);
  }

  @Get('skills')
  skills() {
    return this.content.listSkills();
  }

  // Uploaded files are never edited, only replaced, so they can be cached forever.
  @Get(['images/:id', 'files/:id'])
  async file(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const { mime, bytes } = await this.images.get(id);
    res.set({
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Security-Policy': "default-src 'none'",
      'Cross-Origin-Resource-Policy': 'same-origin',
      ...(mime === 'application/pdf' && { 'Content-Disposition': 'attachment; filename="CV.pdf"' }),
    });
    res.send(bytes);
  }
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly content: ContentService,
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

  @Get('experiences')
  experiences() {
    return this.content.listExperiences(true);
  }

  @Post('experiences')
  createExperience(@Body() body: CreateExperienceDto) {
    return this.content.createExperience(body);
  }

  @Patch('experiences/:id')
  updateExperience(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateExperienceDto) {
    return this.content.updateExperience(id, body);
  }

  @Delete('experiences/:id')
  @HttpCode(204)
  removeExperience(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.removeExperience(id);
  }

  @Post('skills')
  createSkillGroup(@Body() body: CreateSkillGroupDto) {
    return this.content.createSkillGroup(body);
  }

  @Patch('skills/:id')
  updateSkillGroup(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateSkillGroupDto) {
    return this.content.updateSkillGroup(id, body);
  }

  @Delete('skills/:id')
  @HttpCode(204)
  removeSkillGroup(@Param('id', ParseUUIDPipe) id: string) {
    return this.content.removeSkillGroup(id);
  }

  @Post('images')
  @UseInterceptors(UPLOAD)
  upload(@UploadedFile() file: Express.Multer.File | undefined) {
    return this.images.save(file?.buffer);
  }

  // Images or a PDF (the CV).
  @Post('files')
  @UseInterceptors(UPLOAD)
  uploadFile(@UploadedFile() file: Express.Multer.File | undefined) {
    return this.images.save(file?.buffer, true);
  }
}
