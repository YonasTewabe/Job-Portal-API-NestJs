import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response as ExpressResponse } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { ApplicantService } from './applicant.service';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('applicants')
@UseInterceptors(ClassSerializerInterceptor)
export class ApplicantController {
  constructor(private readonly applicantService: ApplicantService) {}

  /** Authenticated user: get their own applicant profile */
  @Get('me')
  @Roles('user')
  getMyProfile(@CurrentUser() user: { id: string }) {
    return this.applicantService.getOrCreate(user.id);
  }

  /** Authenticated user: update their own applicant profile */
  @Patch('me')
  @Roles('user')
  updateMyProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateApplicantDto,
  ) {
    return this.applicantService.update(user.id, dto);
  }

  /** Authenticated user: upload CV file and attach to their profile */
  @Post('me/cv')
  @Roles('user')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCv(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.applicantService.update(user.id, { cv: file.originalname });
  }

  /** Serve a CV PDF by filename */
  @Get('cv/:filename')
  @Roles('superadmin', 'company_admin', 'user')
  getPdf(
    @Param('filename') filename: string,
    @Res() response: ExpressResponse,
  ) {
    const filePath = join(process.cwd(), 'uploads', filename);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `inline; filename=${filename}`);
    createReadStream(filePath).pipe(response);
  }

  /** Company admin / superadmin: list all applicants */
  @Get()
  @Roles('superadmin', 'company_admin')
  findAll() {
    return this.applicantService.findAll();
  }

  @Get(':id')
  @Roles('superadmin', 'company_admin')
  findOne(@Param('id') id: string) {
    return this.applicantService.findOne(id);
  }
}
