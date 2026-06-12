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
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Controller('applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  /** Applicant: submit a new application */
  @Post()
  @Roles('user')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationService.create(dto, user.id);
  }

  /** Superadmin: all applications; company_admin: filtered by companyId; user: by applicantId or userId */
  @Get()
  findAll(
    @Query('companyId') companyId?: string,
    @Query('applicantId') applicantId?: string,
    @Query('userId') userId?: string,
    @Query('jobId') jobId?: string,
  ) {
    if (companyId) return this.applicationService.findByCompany(companyId);
    if (applicantId)
      return this.applicationService.findByApplicant(applicantId);
    if (userId) return this.applicationService.findByUser(userId);
    if (jobId) return this.applicationService.findByJob(jobId);
    return this.applicationService.findAll();
  }

  @Get('status/:status')
  countByStatus(@Param('status') status: string) {
    return this.applicationService.countByStatus(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationService.findOne(id);
  }

  /** Company admin: update application status / schedule interview */
  @Patch(':id')
  @Roles('company_admin', 'superadmin')
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationService.update(id, dto);
  }

  @Delete(':id')
  @Roles('superadmin', 'user')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.applicationService.remove(id);
  }
}
