// application.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('application')
@UseGuards(AuthGuard)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post('apply')
  async create(@Body() createApplicationDto: CreateApplicationDto) {
    return this.applicationService.create(createApplicationDto);
  }

  @Get('all')
  async findAll() {
    return this.applicationService.findAll();
  }
  @Get('check/:jobid/:userid')
  async checkExistingApplication(
    @Param('jobid') jobid: string,
    @Param('userid') userid: string,
  ) {
    return this.applicationService.check(jobid, userid);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.applicationService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateApplicationDto: UpdateApplicationDto) {
    return this.applicationService.update(id, updateApplicationDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.applicationService.remove(id);
  }
}
