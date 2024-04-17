import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './entities/job.entity';
import { JobsController } from './jobs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
  TypeOrmModule.forFeature([Job]), // Provide the Job repository
],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
