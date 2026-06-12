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
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response as ExpressResponse } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { uploadsDir } from './cv-upload.config';
import { ApplicantService } from './applicant.service';
import { cvUploadOptions } from './cv-upload.config';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { CreateApplicantProfileDto } from './dto/create-applicant-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('applicants')
@UseInterceptors(ClassSerializerInterceptor)
export class ApplicantController {
  constructor(private readonly applicantService: ApplicantService) {}

  /** Authenticated user: list all applicant profiles */
  @Get('me/profiles')
  @Roles('user')
  listMyProfiles(@CurrentUser() user: { id: string }) {
    return this.applicantService.listByUser(user.id);
  }

  /** Authenticated user: create a new applicant profile */
  @Post('me/profiles')
  @Roles('user')
  @HttpCode(HttpStatus.CREATED)
  createMyProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateApplicantProfileDto,
  ) {
    return this.applicantService.createProfile(user.id, dto);
  }

  /** Authenticated user: get a specific applicant profile */
  @Get('me/profiles/:id')
  @Roles('user')
  getMyProfile(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.applicantService.findProfileByUser(user.id, id);
  }

  /** Authenticated user: update a specific applicant profile */
  @Patch('me/profiles/:id')
  @Roles('user')
  updateMyProfile(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateApplicantDto,
  ) {
    return this.applicantService.update(user.id, dto, id);
  }

  /** Authenticated user: upload CV for a specific profile */
  @Post('me/profiles/:id/cv')
  @Roles('user')
  @UseInterceptors(FileInterceptor('file', cvUploadOptions))
  async uploadProfileCv(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.applicantService.update(user.id, { cv: file.filename }, id);
  }

  /** Authenticated user: delete an applicant profile */
  @Delete('me/profiles/:id')
  @Roles('user')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyProfile(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    await this.applicantService.deleteProfile(user.id, id);
  }

  /** Authenticated user: get their default applicant profile */
  @Get('me')
  @Roles('user')
  getMyProfileDefault(@CurrentUser() user: { id: string }) {
    return this.applicantService.getOrCreate(user.id);
  }

  /** Authenticated user: update their default applicant profile */
  @Patch('me')
  @Roles('user')
  updateMyProfileDefault(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateApplicantDto,
  ) {
    return this.applicantService.update(user.id, dto);
  }

  /** Authenticated user: upload CV file to default profile */
  @Post('me/cv')
  @Roles('user')
  @UseInterceptors(FileInterceptor('file', cvUploadOptions))
  async uploadCv(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.applicantService.update(user.id, { cv: file.filename });
  }

  /** Serve a CV PDF by filename */
  @Get('cv/:filename')
  @Roles('superadmin', 'company_admin', 'user')
  getPdf(
    @Param('filename') filename: string,
    @Res() response: ExpressResponse,
  ) {
    let decoded = filename;
    try {
      decoded = decodeURIComponent(filename);
    } catch {
      decoded = filename;
    }
    const filePath = join(uploadsDir, decoded.replace(/[/\\]/g, ''));

    if (!existsSync(filePath)) {
      throw new NotFoundException('CV file not found');
    }

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${decoded.split(/[/\\]/).pop()?.replace(/"/g, '') ?? 'cv.pdf'}"`,
    );

    const stream = createReadStream(filePath);
    stream.on('error', () => {
      if (!response.headersSent) {
        response.status(500).end();
      } else {
        response.end();
      }
    });
    stream.pipe(response);
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
