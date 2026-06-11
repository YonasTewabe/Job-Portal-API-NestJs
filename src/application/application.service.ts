import {
  BadRequestException,
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
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(Applicant)
    private readonly applicantRepo: Repository<Applicant>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateApplicationDto): Promise<Application> {
    const applicant = await this.applicantRepo.findOne({
      where: { id: dto.applicantId },
      relations: ['user'],
    });
    if (!applicant) throw new NotFoundException('Applicant not found');
    if (!applicant.profileCompleted) {
      throw new BadRequestException(
        'Complete your profile before applying for jobs',
      );
    }

    const job = await this.jobRepo.findOne({
      where: { id: dto.jobId },
      relations: ['company', 'company.admin'],
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.isOpen === false) {
      throw new BadRequestException('This job is no longer accepting applications');
    }
    if (new Date(job.deadline) < new Date()) {
      throw new BadRequestException('Application deadline has passed');
    }

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
    const saved = await this.applicationRepo.save(application);

    const adminId = job.company?.admin?.id;
    if (adminId) {
      await this.notificationsService.notifyApplicationReceived({
        adminUserId: adminId,
        applicantName: applicant.user?.name ?? 'An applicant',
        jobTitle: job.title,
        jobId: job.id,
        applicationId: saved.id,
      });
    }

    return saved;
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
    const previousStatus = application.status;
    const previousInterviewDate = application.interviewDate
      ? new Date(application.interviewDate).toISOString()
      : null;
    const previousInterviewLocation = application.interviewLocation ?? null;

    Object.assign(application, dto);
    const saved = await this.applicationRepo.save(application);

    const applicantUserId = application.applicant?.user?.id;
    const jobTitle = application.job?.title ?? 'a job';

    try {
      if (applicantUserId && dto.status && dto.status !== previousStatus) {
        if (
          dto.status === 'Interview Scheduled' &&
          saved.interviewDate &&
          saved.interviewLocation
        ) {
          await this.notificationsService.notifyInterviewScheduled({
            applicantUserId,
            jobTitle,
            interviewDate: new Date(saved.interviewDate),
            interviewLocation: saved.interviewLocation,
            applicationId: saved.id,
          });
        } else {
          await this.notificationsService.notifyApplicationStatus({
            applicantUserId,
            jobTitle,
            status: dto.status,
            applicationId: saved.id,
          });
        }
      } else if (
        applicantUserId &&
        saved.status === 'Interview Scheduled' &&
        saved.interviewDate &&
        saved.interviewLocation
      ) {
        const interviewChanged =
          (dto.interviewDate &&
            new Date(dto.interviewDate).toISOString() !== previousInterviewDate) ||
          (dto.interviewLocation !== undefined &&
            dto.interviewLocation !== previousInterviewLocation);

        if (interviewChanged) {
          await this.notificationsService.notifyInterviewUpdated({
            applicantUserId,
            jobTitle,
            interviewDate: new Date(saved.interviewDate),
            interviewLocation: saved.interviewLocation,
            applicationId: saved.id,
          });
        }
      }
    } catch {
      // Notification failures must not block status updates
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const app = await this.findOne(id);
    await this.applicationRepo.remove(app);
  }
}
