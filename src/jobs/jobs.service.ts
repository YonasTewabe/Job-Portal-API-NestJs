import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { Company } from '../company/entities/company.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepo: Repository<Job>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async create(dto: CreateJobDto): Promise<Job> {
    const company = await this.companyRepo.findOneBy({ id: dto.companyId });
    if (!company) throw new NotFoundException('Company not found');

    const job = this.jobsRepo.create({
      title: dto.title,
      type: dto.type,
      location: dto.location,
      description: dto.description,
      requirement: dto.requirement,
      salary: dto.salary?.trim() || null,
      deadline: new Date(dto.deadline),
      isOpen: true,
      company,
    });
    return this.jobsRepo.save(job);
  }

  async findAll(): Promise<Job[]> {
    return this.jobsRepo.find({
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCompany(companyId: string): Promise<Job[]> {
    return this.jobsRepo.find({
      where: { company: { id: companyId } },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Job> {
    const job = await this.jobsRepo.findOne({
      where: { id },
      relations: ['company'],
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async update(id: string, dto: UpdateJobDto): Promise<Job> {
    const job = await this.findOne(id);

    if (dto.companyId) {
      const company = await this.companyRepo.findOneBy({ id: dto.companyId });
      if (!company) throw new NotFoundException('Company not found');
      job.company = company;
    }

    const { companyId: _, deadline, salary, ...rest } = dto;
    Object.assign(job, rest);
    if (deadline) job.deadline = new Date(deadline);
    if (salary !== undefined) {
      job.salary = salary?.trim() || null;
    }

    return this.jobsRepo.save(job);
  }

  async remove(id: string): Promise<void> {
    const job = await this.findOne(id);
    await this.jobsRepo.remove(job);
  }
}
