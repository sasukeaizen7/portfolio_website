import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ImagesService } from './images.service';
import { AdminController, PublicController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [PublicController, AdminController],
  providers: [ProjectsService, ContentService, ImagesService],
})
export class ProjectsModule {}
