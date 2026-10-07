import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { AdminController, PublicController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [PublicController, AdminController],
  providers: [ProjectsService, ImagesService],
})
export class ProjectsModule {}
