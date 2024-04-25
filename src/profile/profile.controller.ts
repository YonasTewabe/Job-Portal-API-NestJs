import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UnauthorizedException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { Response as ExpressResponse } from 'express';
import { Request as ExpressRequest } from 'express';
import { createReadStream, createWriteStream, mkdir } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import * as multer from 'multer';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createReadStreamAsync = promisify(createReadStream);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mkdirAsync = promisify(mkdir);

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private jwtService: JwtService
  ) {}

  @Post('signup')
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('role') role: string,
  ) {
    const hashedPassword = await bcrypt.hash(password, 12);

    const profile = await this.profileService.create({
      role,
      email,
      password: hashedPassword,
      fullname: '',
      age: '',
      sex: '',
      degree: '',
      university: '',
      experience: '',
      contactEmail: '',
      contactPhone: '',
      cv: ''
    });

    return profile;
  }

  @Post('login')
async login(
  @Body('email') email: string,
  @Body('password') password: string,
  @Res({ passthrough: true }) response: ExpressResponse,
) {
  const profile = await this.profileService.findOneBy({ email });
  if (!profile) {
    throw new BadRequestException('Invalid credentials');
  }
  if (!await bcrypt.compare(password, profile.password)) {
    throw new BadRequestException('Invalid credentials');
  }
  const jwt = await this.jwtService.signAsync({ id: profile.id });

  response.cookie('jwt', jwt, { httpOnly: true });

  return {
    message: 'Success',
    profileId: profile.id,
    jwt: jwt,
  };
}


  @Get('pdf/:filename')
  async getPdf(@Param('filename') filename: string, @Res() response: ExpressResponse, @Req() request: ExpressRequest) {
    try {
      const cookie = request.cookies['jwt'];
      const data = await this.jwtService.verifyAsync(cookie);

      if (!data) {
        throw new UnauthorizedException();
      }

      const filePath = join(__dirname, '..', 'uploads', filename);
  
      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader('Content-Disposition', `inline; filename=${filename}`);
  
      const stream = createReadStream(filePath);
      stream.pipe(response);
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  @Get('profile')
  async profile(@Req() request: ExpressRequest) {
    try {
      const cookie = request.cookies['jwt'];
      const { id } = await this.jwtService.verifyAsync(cookie);
  
      if (!id) {
        throw new UnauthorizedException();
      }
  
      const profile = await this.profileService.findOne(id);
      if (!profile) {
        throw new UnauthorizedException();
      }
  
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = profile;
  
      return { id: profile.id, ...result };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
  
  @Post('logout')
  async logout(@Res({ passthrough: true }) response: ExpressResponse) {
    response.clearCookie('jwt');
    return { message: 'Logout successful' };
  }
  

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file, @Body() createProfileDto: CreateProfileDto) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Save the file to a specific directory
      const filePath = './uploads/' + file.originalname;
      createWriteStream(filePath, file.buffer);

      // Update the createProfileDto object with the file name
      const profileData = { ...createProfileDto, cv: file.originalname };

      // Save the updated profileData to the database
      const profile = await this.profileService.create(profileData);

      return profile;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  @Post('create')
  async createProfile(@Body() createProfileDto: CreateProfileDto) {
    const { password, ...rest } = createProfileDto;
    const hashedPassword = await bcrypt.hash(password, 12);
    const profile = await this.profileService.create({ ...rest, password: hashedPassword });

    return profile;
  }

  @Get()
  findAll() {
    return this.profileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profileService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file: multer.File,
  ) {
    // Hash the new password if it is provided
    if (updateProfileDto.password) {
      updateProfileDto.password = await bcrypt.hash(updateProfileDto.password, 12);
    }
  
    let profileData = { ...updateProfileDto };
    if (file) {
      // Save the file to a specific directory
      const filePath = './uploads/' + file.originalname;
      createWriteStream(filePath, { flags: 'w' }).write(file.buffer);
  
      // Update the createProfileDto object with the file name
      profileData = { ...updateProfileDto, cv: file.originalname };
    }
  
    return this.profileService.update(id, profileData);
  }
  

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profileService.remove(id);
  }
}
