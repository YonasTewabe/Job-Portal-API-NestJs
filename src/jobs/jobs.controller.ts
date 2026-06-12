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
  UseGuards,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
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
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user?: { id: string; role: UserRole },
  ) {
    return this.jobsService.findOne(id, user);
  }

  @Patch(':id/publish')
  @Roles('company_admin', 'superadmin')
  publish(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.jobsService.publish(id, user);
  }

  @Patch(':id')
  @Roles('company_admin', 'superadmin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.jobsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('company_admin', 'superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}
