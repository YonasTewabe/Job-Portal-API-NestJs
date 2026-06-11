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
  UseInterceptors,
} from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Superadmin: create any user (company_admin, user, etc.) */
  @Post()
  @Roles('superadmin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /** Superadmin: list all users, optionally filtered by role */
  @Get()
  @Roles('superadmin')
  findAll(@Query('role') role?: string) {
    if (role) return this.usersService.findByRole(role);
    return this.usersService.findAll();
  }

  /** Any authenticated user: get their own profile */
  @Get('me')
  getMe(@CurrentUser() currentUser: { id: string }) {
    return this.usersService.findOne(currentUser.id);
  }

  @Get(':id')
  @Roles('superadmin', 'company_admin')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
