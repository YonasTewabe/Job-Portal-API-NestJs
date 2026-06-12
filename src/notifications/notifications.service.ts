import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

export interface CreateNotificationInput {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkPath?: string;
  referenceId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(input: CreateNotificationInput): Promise<Notification | null> {
    const recipient = await this.userRepo.findOneBy({ id: input.recipientId });
    if (!recipient) return null;

    const notification = this.notificationRepo.create({
      recipient,
      type: input.type,
      title: input.title,
      message: input.message,
      linkPath: input.linkPath ?? null,
      referenceId: input.referenceId ?? null,
      read: false,
    });
    return this.notificationRepo.save(notification);
  }

  async findForUser(userId: string, limit = 50) {
    const items = await this.notificationRepo.find({
      where: { recipient: { id: userId } },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      linkPath: n.linkPath,
      referenceId: n.referenceId,
      read: n.read,
      createdAt: n.createdAt,
    }));
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { recipient: { id: userId }, read: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id, recipient: { id: userId } },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.read = true;
    await this.notificationRepo.save(notification);
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepo.update(
      { recipient: { id: userId }, read: false },
      { read: true },
    );
    return { success: true };
  }

  async notifyApplicationReceived(params: {
    adminUserId: string;
    applicantName: string;
    jobTitle: string;
    jobId: string;
    applicationId: string;
  }) {
    return this.create({
      recipientId: params.adminUserId,
      type: 'application_received',
      title: 'New application',
      message: `${params.applicantName} applied for ${params.jobTitle}.`,
      linkPath: `/applicants/${params.jobId}`,
      referenceId: params.applicationId,
    });
  }

  async notifyApplicationStatus(params: {
    applicantUserId: string;
    jobTitle: string;
    status: string;
    applicationId: string;
  }) {
    const statusMessages: Record<string, string> = {
      'Under Consideration': `Your application for "${params.jobTitle}" is under consideration.`,
      Rejected: `Your application for "${params.jobTitle}" was not selected.`,
      'Interview Scheduled': `Your interview for "${params.jobTitle}" has been scheduled.`,
    };

    return this.create({
      recipientId: params.applicantUserId,
      type: 'application_status',
      title: 'Application update',
      message:
        statusMessages[params.status] ??
        `Your application for "${params.jobTitle}" was updated to ${params.status}.`,
      linkPath: '/status',
      referenceId: params.applicationId,
    });
  }

  async notifyInterviewScheduled(params: {
    applicantUserId: string;
    jobTitle: string;
    interviewDate: Date;
    interviewLocation: string;
    applicationId: string;
  }) {
    const when = params.interviewDate.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    return this.create({
      recipientId: params.applicantUserId,
      type: 'interview_scheduled',
      title: 'Interview scheduled',
      message: `Interview for "${params.jobTitle}" on ${when} at ${params.interviewLocation}.`,
      linkPath: '/status',
      referenceId: params.applicationId,
    });
  }

  async notifyInterviewUpdated(params: {
    applicantUserId: string;
    jobTitle: string;
    interviewDate: Date;
    interviewLocation: string;
    applicationId: string;
  }) {
    const when = params.interviewDate.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    return this.create({
      recipientId: params.applicantUserId,
      type: 'interview_updated',
      title: 'Interview rescheduled',
      message: `Interview for "${params.jobTitle}" updated to ${when} at ${params.interviewLocation}.`,
      linkPath: '/status',
      referenceId: params.applicationId,
    });
  }

  async notifyJobClosed(params: {
    applicantUserId: string;
    jobTitle: string;
    jobId: string;
  }) {
    return this.create({
      recipientId: params.applicantUserId,
      type: 'job_closed',
      title: 'Job closed',
      message: `"${params.jobTitle}" is no longer accepting applications.`,
      linkPath: `/job/${params.jobId}`,
      referenceId: params.jobId,
    });
  }

  async notifySuperadminsPaymentReceived(params: {
    superadminIds: string[];
    companyName: string;
    jobTitle: string;
    amount: number;
    currency: string;
    paymentId: string;
  }) {
    const formatted = Number(params.amount).toLocaleString('en-US');
    const message = `${params.companyName} paid ${formatted} ${params.currency} to post "${params.jobTitle}".`;

    await Promise.all(
      params.superadminIds.map((recipientId) =>
        this.create({
          recipientId,
          type: 'payment_received',
          title: 'Job posting payment',
          message,
          linkPath: '/superadmin/payments',
          referenceId: params.paymentId,
        }),
      ),
    );
  }
}
