import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { Applicant } from '../applicant/entities/applicant.entity';
import { Job } from '../jobs/entities/job.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(Applicant)
    private readonly applicantRepo: Repository<Applicant>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  async create(dto: CreateApplicationDto): Promise<Application> {
    const applicant = await this.applicantRepo.findOneBy({ id: dto.applicantId });
    if (!applicant) throw new NotFoundException('Applicant not found');

    const job = await this.jobRepo.findOneBy({ id: dto.jobId });
    if (!job) throw new NotFoundException('Job not found');

    // Prevent duplicate applications
    const existing = await this.applicationRepo.findOne({
      where: { applicant: { id: dto.applicantId }, job: { id: dto.jobId } },
    });
    if (existing) throw new ConflictException('Already applied to this job');

    const application = this.applicationRepo.create({
      applicant,
      job,
      applicationDate: new Date(dto.applicationDate),
      status: 'Pending',
    });
    return this.applicationRepo.save(application);
  }

  async findAll(): Promise<Application[]> {
    return this.applicationRepo.find({ relations: ['applicant', 'applicant.user', 'job', 'job.company'] });
  }

  async findByApplicant(applicantId: string): Promise<Application[]> {
    return this.applicationRepo.find({
      where: { applicant: { id: applicantId } },
      relations: ['job', 'job.company'],
    });
  }

  async findByJob(jobId: string): Promise<Application[]> {
    return this.applicationRepo.find({
      where: { job: { id: jobId } },
      relations: ['applicant', 'applicant.user'],
    });
  }

  async findByCompany(companyId: string): Promise<Application[]> {
    return this.applicationRepo.find({
      where: { job: { company: { id: companyId } } },
      relations: ['applicant', 'applicant.user', 'job'],
    });
  }

  async findOne(id: string): Promise<Application> {
    const app = await this.applicationRepo.findOne({
      where: { id },
      relations: ['applicant', 'applicant.user', 'job', 'job.company'],
    });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async countByStatus(status: string): Promise<number> {
    return this.applicationRepo.count({ where: { status } });
  }

  async update(id: string, dto: UpdateApplicationDto): Promise<Application> {
    const application = await this.findOne(id);
    Object.assign(application, dto);
    return this.applicationRepo.save(application);
  }

  async remove(id: string): Promise<void> {
    const app = await this.findOne(id);
    await this.applicationRepo.remove(app);
  }
}
