/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { Response as ExpressResponse } from 'express';
import { Request as ExpressRequest } from 'express';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService,
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
          contactPhone: ''
      });

      // delete profile.password;

      // return profile;
  }

  @Post('login')
  async login(
      @Body('email') email: string,
      @Body('password') password: string,
      @Res({ passthrough: true }) response: ExpressResponse,
  ) {
      const profile = await this.profileService.findOneBy({email});

      if (!profile) {
          throw new BadRequestException('Invalid credentials');
      }

      if (!await bcrypt.compare(password, profile.password)) {
          throw new BadRequestException('Invalid credentials');
      }

      const jwt = await this.jwtService.signAsync({ id: profile.id });

      response.cookie('jwt', jwt, { httpOnly: true });

      return {
          message: 'Success'
      };
  }

  @Get('profile')
    async profile(@Req() request: ExpressRequest) {
        try {
            const cookie = request.cookies['jwt'];

            const data = await this.jwtService.verifyAsync(cookie);

            if (!data) {
                throw new UnauthorizedException();
            }

            const profile = await this.profileService.findOneBy(data['id']);

            const { password, ...result } = profile;

            return result;
        } catch (e) {
            throw new UnauthorizedException();
        }
    }
    @Post('logout')
    async logout(@Res({ passthrough: true }) response: ExpressResponse) {
        response.clearCookie('jwt');

        return {
            message: 'Success'
        }
    }
    @Post('create')
    create(@Body() createProfileDto: CreateProfileDto) {
      return this.profileService.create(createProfileDto);
    }
    @Get()
    findAll() {
      return this.profileService.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.profileService.findOne(+id);
    }
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
      return this.profileService.update(+id, updateProfileDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.profileService.remove(+id);
    }
}
