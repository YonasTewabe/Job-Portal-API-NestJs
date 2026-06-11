import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from './entities/company.entity';
import { User } from '../users/entities/user.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Creates a company and its company_admin user atomically.
   * Called only by superadmin.
   */
  async create(dto: CreateCompanyDto): Promise<Company> {
    const existingUser = await this.userRepo.findOneBy({ email: dto.adminEmail });
    if (existingUser) throw new ConflictException('Admin email already in use');

    const hashedPassword = await bcrypt.hash(dto.adminPassword, 12);
    const admin = this.userRepo.create({
      name: dto.adminName,
      email: dto.adminEmail,
      password: hashedPassword,
      role: 'company_admin',
    });
    const savedAdmin = await this.userRepo.save(admin);

    const company = this.companyRepo.create({
      name: dto.name,
      description: dto.description,
      contactEmail: dto.contactEmail,
      phone: dto.phone,
      isActive: true,
      admin: savedAdmin,
    });
    return this.companyRepo.save(company);
  }

  async findAll(): Promise<Company[]> {
    return this.companyRepo.find({
      relations: ['admin', 'jobs'],
      order: { jobs: { createdAt: 'DESC' } },
    });
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepo.findOne({
      where: { id },
      relations: ['admin', 'jobs'],
      order: { jobs: { createdAt: 'DESC' } },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async findByAdmin(adminId: string): Promise<Company> {
    const company = await this.companyRepo.findOne({
      where: { admin: { id: adminId } },
      relations: ['admin', 'jobs'],
      order: { jobs: { createdAt: 'DESC' } },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOne(id);
    Object.assign(company, dto);
    return this.companyRepo.save(company);
  }

  async remove(id: string): Promise<void> {
    const company = await this.findOne(id);
    await this.companyRepo.remove(company);
  }
}
