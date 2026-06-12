import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { Applicant } from '../applicant/entities/applicant.entity';
import { Job } from '../jobs/entities/job.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatService } from '../chat/chat.service';

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
    private readonly chatService: ChatService,
  ) {}

  async create(dto: CreateApplicationDto, userId?: string): Promise<Application> {
    const applicant = await this.applicantRepo.findOne({
      where: { id: dto.applicantId },
      relations: ['user'],
    });
    if (!applicant) throw new NotFoundException('Applicant not found');
    if (userId && applicant.user?.id !== userId) {
      throw new BadRequestException('Profile does not belong to this account');
    }
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
    if (job.status === 'draft') {
      throw new BadRequestException('This job is not published yet');
    }
    if (job.isOpen === false) {
      throw new BadRequestException('This job is no longer accepting applications');
    }
    if (new Date(job.deadline) < new Date()) {
      throw new BadRequestException('Application deadline has passed');
    }

    const existing = await this.applicationRepo.findOne({
      where: {
        job: { id: dto.jobId },
        applicant: { user: { id: applicant.user.id } },
      },
      relations: ['applicant', 'applicant.user'],
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
        applicantName: applicant.fullname ?? applicant.user?.name ?? 'An applicant',
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
      relations: ['job', 'job.company', 'applicant'],
    });
  }

  async findByUser(userId: string): Promise<Application[]> {
    return this.applicationRepo.find({
      where: { applicant: { user: { id: userId } } },
      relations: ['job', 'job.company', 'applicant'],
      order: { applicationDate: 'DESC' },
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
      relations: ['applicant', 'applicant.user', 'job', 'job.company', 'job.company.admin'],
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
    const previousInterviewHasTime = application.interviewHasTime ?? false;

    if (dto.interviewDate !== undefined) {
      const hasTime =
        dto.interviewHasTime ?? application.interviewHasTime ?? false;
      this.assertInterviewNotInPast(dto.interviewDate, hasTime);
    }

    Object.assign(application, dto);
    const saved = await this.applicationRepo.save(application);

    const applicantUserId = application.applicant?.user?.id;
    const adminUserId = application.job?.company?.admin?.id;
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
          if (adminUserId) {
            await this.chatService.sendApplicationStatusMessage({
              applicationId: saved.id,
              senderUserId: adminUserId,
              content: this.buildInterviewScheduledMessage(
                jobTitle,
                saved.interviewDate,
                saved.interviewLocation,
                saved.interviewHasTime,
              ),
            });
          }
        } else {
          await this.notificationsService.notifyApplicationStatus({
            applicantUserId,
            jobTitle,
            status: dto.status,
            applicationId: saved.id,
          });
          if (adminUserId) {
            const chatMessage = this.buildStatusChangeMessage(
              jobTitle,
              dto.status,
            );
            if (chatMessage) {
              await this.chatService.sendApplicationStatusMessage({
                applicationId: saved.id,
                senderUserId: adminUserId,
                content: chatMessage,
              });
            }
          }
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
            dto.interviewLocation !== previousInterviewLocation) ||
          (dto.interviewHasTime !== undefined &&
            dto.interviewHasTime !== previousInterviewHasTime);

        if (interviewChanged) {
          await this.notificationsService.notifyInterviewUpdated({
            applicantUserId,
            jobTitle,
            interviewDate: new Date(saved.interviewDate),
            interviewLocation: saved.interviewLocation,
            applicationId: saved.id,
          });
          if (adminUserId) {
            await this.chatService.sendApplicationStatusMessage({
              applicationId: saved.id,
              senderUserId: adminUserId,
              content: this.buildInterviewRescheduledMessage(
                jobTitle,
                saved.interviewDate,
                saved.interviewLocation,
                saved.interviewHasTime,
              ),
            });
          }
        }
      }
    } catch {
      // Notification and chat failures must not block status updates
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const app = await this.findOne(id);
    await this.chatService.deleteConversationsForApplications([app.id]);
    await this.applicationRepo.remove(app);
  }

  /** Delete all applications for a job and their related conversations */
  async deleteByJobId(jobId: string, manager?: EntityManager): Promise<void> {
    const applicationRepo = manager
      ? manager.getRepository(Application)
      : this.applicationRepo;

    const applications = await applicationRepo.find({
      where: { job: { id: jobId } },
      select: { id: true },
    });

    if (!applications.length) return;

    const applicationIds = applications.map((a) => a.id);
    await this.chatService.deleteConversationsForApplications(
      applicationIds,
      manager,
    );
    await applicationRepo.delete({ job: { id: jobId } });
  }

  private assertInterviewNotInPast(
    interviewDate: string,
    hasTime: boolean,
  ): void {
    const now = new Date();
    if (!hasTime) {
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const dateOnly = interviewDate.slice(0, 10);
      const selected = new Date(`${dateOnly}T00:00:00`);
      if (selected < todayStart) {
        throw new BadRequestException(
          'Interview must be scheduled for today or a future date',
        );
      }
      return;
    }
    if (new Date(interviewDate) < now) {
      throw new BadRequestException(
        'Interview must be scheduled for today or a future date',
      );
    }
  }

  private formatInterviewWhen(
    date: Date | string,
    hasTime = true,
  ): string {
    const d = new Date(date);
    if (!hasTime) {
      return d.toLocaleDateString('en-US', { dateStyle: 'medium' });
    }
    return d.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  private buildStatusChangeMessage(
    jobTitle: string,
    status: string,
  ): string | null {
    switch (status) {
      case 'Under Consideration':
        return `Your application for "${jobTitle}" has been accepted and is under consideration.`;
      case 'Rejected':
        return `Your application for "${jobTitle}" was not selected.`;
      default:
        return null;
    }
  }

  private buildInterviewScheduledMessage(
    jobTitle: string,
    interviewDate: Date | string,
    interviewLocation: string,
    hasTime = true,
  ): string {
    const when = this.formatInterviewWhen(interviewDate, hasTime);
    return `Your interview for "${jobTitle}" has been scheduled on ${when} at ${interviewLocation}.`;
  }

  private buildInterviewRescheduledMessage(
    jobTitle: string,
    interviewDate: Date | string,
    interviewLocation: string,
    hasTime = true,
  ): string {
    const when = this.formatInterviewWhen(interviewDate, hasTime);
    return `Your interview for "${jobTitle}" has been rescheduled to ${when} at ${interviewLocation}.`;
  }
}
