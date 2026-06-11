import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /** Company admin: post a new job */
  @Post()
  @Roles('company_admin', 'superadmin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateJobDto) {
    return this.jobsService.create(dto);
  }

  /** Public: browse job listings */
  @Public()
  @Get()
  findAll(@Query('companyId') companyId?: string) {
    if (companyId) return this.jobsService.findByCompany(companyId);
    return this.jobsService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @Roles('company_admin', 'superadmin')
  update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.jobsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('company_admin', 'superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}
