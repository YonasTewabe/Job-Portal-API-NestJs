import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Public } from './decorators/public.decorator';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: ExpressResponse,
  ) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }

    const payload = { id: user.id, role: user.role };
    const jwt = await this.jwtService.signAsync(payload);

    // Set httpOnly cookie as primary auth mechanism
    response.cookie('jwt', jwt, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return {
      message: 'Login successful',
      jwt,           // also returned in body so frontend can store it
      userId: user.id,
      name: user.name,
      role: user.role,
      // Extra context for company_admin so frontend can navigate correctly
      companyId: user.company?.id ?? null,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: ExpressResponse) {
    response.clearCookie('jwt');
    return { message: 'Logout successful' };
  }

  /** Public: register a new regular user (role = 'user') */
  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: LoginDto & { name: string }) {
    return this.usersService.create({
      name: dto.name ?? dto.email.split('@')[0],
      email: dto.email,
      password: dto.password,
      role: 'user',
    });
  }
}
