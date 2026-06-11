import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { Company } from '../company/entities/company.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ApplicationService } from '../application/application.service';


@Injectable()

export class JobsService {

  constructor(

    @InjectRepository(Job)

    private readonly jobsRepo: Repository<Job>,

    @InjectRepository(Company)

    private readonly companyRepo: Repository<Company>,

    private readonly notificationsService: NotificationsService,

    private readonly applicationService: ApplicationService,

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

      salary: dto.salary,

      deadline: new Date(dto.deadline),

      isOpen: true,

      company,

    });

    return this.jobsRepo.save(job);

  }



  async findAll(): Promise<Job[]> {

    return this.jobsRepo.find({ relations: ['company'] });

  }



  async findByCompany(companyId: string): Promise<Job[]> {

    return this.jobsRepo.find({

      where: { company: { id: companyId } },

      relations: ['company'],

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

    const wasOpen = job.isOpen !== false;



    if (dto.companyId) {

      const company = await this.companyRepo.findOneBy({ id: dto.companyId });

      if (!company) throw new NotFoundException('Company not found');

      job.company = company;

    }

    const { companyId: _, deadline, ...rest } = dto;

    Object.assign(job, rest);

    if (deadline) job.deadline = new Date(deadline);

    const saved = await this.jobsRepo.save(job);



    if (wasOpen && saved.isOpen === false) {

      const applications = await this.applicationService.findByJob(saved.id);

      const notified = new Set<string>();



      for (const application of applications) {

        const userId = application.applicant?.user?.id;

        if (!userId || notified.has(userId)) continue;

        notified.add(userId);



        await this.notificationsService.notifyJobClosed({

          applicantUserId: userId,

          jobTitle: saved.title,

          jobId: saved.id,

        });

      }

    }



    return saved;

  }



  async remove(id: string): Promise<void> {

    const job = await this.findOne(id);

    await this.jobsRepo.remove(job);

  }

}


