import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { Applicant } from '../applicant/entities/applicant.entity';
import { Job } from '../jobs/entities/job.entity';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, Applicant, Job]),
    NotificationsModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
