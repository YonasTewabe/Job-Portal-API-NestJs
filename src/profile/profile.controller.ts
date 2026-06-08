import {
  BadRequestException,
  Body,
  ConflictException,
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response as ExpressResponse } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import * as multer from 'multer';
import { JwtService } from '@nestjs/jwt';
import { ClassSerializerInterceptor } from '@nestjs/common';

import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('profile')
@UseInterceptors(ClassSerializerInterceptor) // Ensures @Exclude() on entity fields is respected
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Public routes (no token required) ──────────────────────────────────────

  @Public()
  @Post('signup')
  async register(@Body() createProfileDto: CreateProfileDto) {
    const existing = await this.profileService.findOneBy({
      email: createProfileDto.email,
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(createProfileDto.password, 12);
    const isHr = createProfileDto.role === 'hr';

    return this.profileService.create({
      ...createProfileDto,
      password: hashedPassword,
      hrdataCompleted: false,
      userdataCompleted: false,
      hrStatus: isHr,
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: ExpressResponse,
  ) {
    const profile = await this.profileService.findOneBy({ email });
    if (!profile || !(await bcrypt.compare(password, profile.password))) {
      // Use a generic message to avoid user enumeration
      throw new BadRequestException('Invalid credentials');
    }

    const token = await this.jwtService.signAsync({
      id: profile.id,
      role: profile.role,
    });

    response.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return {
      message: 'Login successful',
      profileId: profile.id,
      role: profile.role,
      usercompleted: profile.userdataCompleted,
      hrcompleted: profile.hrdataCompleted,
      hrStatus: profile.hrStatus,
      token,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: ExpressResponse) {
    response.clearCookie('jwt');
    response.setHeader('Cache-Control', 'no-store');
    return { message: 'Logout successful' };
  }

  // ── Authenticated routes (global JwtAuthGuard applies) ─────────────────────

  /** Returns the currently authenticated user's profile */
  @Get('me')
  async getMe(@CurrentUser() user: { id: string }) {
    const profile = await this.profileService.findOne(user.id);
    if (!profile) {
      throw new BadRequestException('Profile not found');
    }
    return profile; // password excluded by @Exclude() + ClassSerializerInterceptor
  }

  /** Serve a CV file */
  @Get('pdf/:filename')
  getPdf(
    @Param('filename') filename: string,
    @Res() response: ExpressResponse,
  ) {
    const filePath = join(__dirname, '..', 'uploads', filename);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `inline; filename=${filename}`);
    createReadStream(filePath).pipe(response);
  }

  /** Upload a CV and create a profile */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: multer.File,
    @Body() createProfileDto: CreateProfileDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.profileService.create({
      ...createProfileDto,
      cv: file.originalname,
    });
  }

  @Get('all')
  findAll() {
    return this.profileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profileService.findOne(id);
  }

  /** Forgot password — update by email, no token required */
  @Public()
  @Patch('email/:email')
  async changeByEmail(
    @Param('email') email: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    if (updateProfileDto.password) {
      updateProfileDto.password = await bcrypt.hash(
        updateProfileDto.password,
        12,
      );
    }
    return this.profileService.change(email, updateProfileDto);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file?: multer.File,
  ) {
    if (updateProfileDto.password) {
      updateProfileDto.password = await bcrypt.hash(
        updateProfileDto.password,
        12,
      );
    }

    let profileData = { ...updateProfileDto };

    if (file) {
      profileData = { ...profileData, cv: file.originalname };
    }

    // Auto-flag profile completion
    if (
      profileData.fullname &&
      profileData.age &&
      profileData.sex &&
      profileData.degree &&
      profileData.university &&
      profileData.experience &&
      profileData.userPhone &&
      profileData.cv
    ) {
      profileData.userdataCompleted = true;
    }

    if (
      profileData.companyname &&
      profileData.companydescription &&
      profileData.contactemail &&
      profileData.companyPhone
    ) {
      profileData.hrdataCompleted = true;
    }

    return this.profileService.update(id, profileData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profileService.remove(id);
  }
}
