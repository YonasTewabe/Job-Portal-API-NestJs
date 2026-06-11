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
  UseInterceptors,
} from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('companies')
@UseInterceptors(ClassSerializerInterceptor)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /** Public: self-service company registration */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: CreateCompanyDto) {
    return this.companyService.create(dto);
  }

  /** Superadmin: create a company + its company_admin account */
  @Post()
  @Roles('superadmin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCompanyDto) {
    return this.companyService.create(dto);
  }

  /** Superadmin: list all companies */
  @Get()
  @Roles('superadmin')
  findAll() {
    return this.companyService.findAll();
  }

  /** Company admin: get their own company */
  @Get('mine')
  @Roles('company_admin')
  getMyCompany(@CurrentUser() user: { id: string }) {
    return this.companyService.findByAdmin(user.id);
  }

  @Get(':id')
  @Roles('superadmin', 'company_admin')
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  /** Superadmin or company_admin can update their own company */
  @Patch(':id')
  @Roles('superadmin', 'company_admin')
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.update(id, dto);
  }

  /** Superadmin: delete a company */
  @Delete(':id')
  @Roles('superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.companyService.remove(id);
  }
}
