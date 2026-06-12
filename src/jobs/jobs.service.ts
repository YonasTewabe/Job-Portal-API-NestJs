import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { Company } from '../company/entities/company.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UserRole } from '../users/entities/user.entity';
import { ApplicationService } from '../application/application.service';

type JobViewer = { id: string; role: UserRole };

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepo: Repository<Job>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly dataSource: DataSource,
    private readonly applicationService: ApplicationService,
  ) {}

  async create(dto: CreateJobDto): Promise<Job> {
    const company = await this.companyRepo.findOneBy({ id: dto.companyId });
    if (!company) throw new NotFoundException('Company not found');

    const status = dto.status ?? 'published';

    const job = this.jobsRepo.create({
      title: dto.title,
      type: dto.type,
      location: dto.location,
      description: dto.description,
      requirement: dto.requirement,
      salary: dto.salary?.trim() || null,
      deadline: new Date(dto.deadline),
      status,
      isOpen: status === 'published',
      company,
    });
    return this.jobsRepo.save(job);
  }

  async findAll(): Promise<Job[]> {
    return this.jobsRepo.find({
      where: { status: 'published' },
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

  async findOne(id: string, viewer?: JobViewer): Promise<Job> {
    const job = await this.jobsRepo.findOne({
      where: { id },
      relations: ['company', 'company.admin'],
    });
    if (!job) throw new NotFoundException('Job not found');

    if (job.status === 'draft' && !this.canViewDraft(job, viewer)) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  private isDeadlineInFuture(deadline: Date | string | null | undefined): boolean {
    if (!deadline) return false;
    const d = new Date(deadline);
    if (Number.isNaN(d.getTime())) return false;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const deadlineDay = new Date(d);
    deadlineDay.setHours(0, 0, 0, 0);
    return deadlineDay > todayStart;
  }

  private canViewDraft(job: Job, viewer?: JobViewer): boolean {
    if (!viewer) return false;
    if (viewer.role === 'superadmin') return true;
    if (viewer.role === 'company_admin') {
      return job.company?.admin?.id === viewer.id;
    }
    return false;
  }

  async update(id: string, dto: UpdateJobDto, viewer?: JobViewer): Promise<Job> {
    const job = await this.findOne(id, viewer);

    if (dto.companyId) {
      const company = await this.companyRepo.findOneBy({ id: dto.companyId });
      if (!company) throw new NotFoundException('Company not found');
      job.company = company;
    }

    const { companyId: _, deadline, salary, status, ...rest } = dto;
    Object.assign(job, rest);
    if (deadline) job.deadline = new Date(deadline);
    if (salary !== undefined) {
      job.salary = salary?.trim() || null;
    }
    if (status === 'published' && job.status === 'draft') {
      job.status = 'published';
      job.isOpen = true;
    } else if (status === 'draft') {
      job.status = 'draft';
      job.isOpen = false;
    }

    if (dto.isOpen === true && !this.isDeadlineInFuture(job.deadline)) {
      throw new BadRequestException(
        'A future application deadline is required to reopen this job',
      );
    }

    return this.jobsRepo.save(job);
  }

  async publish(id: string, viewer: JobViewer): Promise<Job> {
    const job = await this.findOne(id, viewer);
    if (job.status !== 'draft') {
      throw new BadRequestException('Only draft jobs can be published');
    }

    if (viewer.role === 'company_admin' && job.company?.admin?.id !== viewer.id) {
      throw new ForbiddenException('Not allowed to publish this job');
    }

    job.status = 'published';
    job.isOpen = true;
    return this.jobsRepo.save(job);
  }

  async remove(id: string): Promise<void> {
    const job = await this.jobsRepo.findOne({
      where: { id },
      relations: ['company'],
    });
    if (!job) throw new NotFoundException('Job not found');

    await this.dataSource.transaction(async (manager) => {
      await this.applicationService.deleteByJobId(id, manager);
      await manager.delete(Job, { id });
    });
  }
}
