import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { Company } from '../company/entities/company.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { ApplicationModule } from '../application/application.module';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Company]), ApplicationModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
