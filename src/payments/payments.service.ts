import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPayment } from './entities/job-payment.entity';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { ChapaService } from '../chapa/chapa.service';
import { CompanyService } from '../company/company.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { JobsService } from '../jobs/jobs.service';
import { RecordPaymentJobDto } from './dto/record-payment-job.dto';

export interface PaymentFilters {
  companyId?: string;
  fromDate?: string;
  toDate?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(JobPayment)
    private readonly paymentRepo: Repository<JobPayment>,
    private readonly chapaService: ChapaService,
    private readonly companyService: CompanyService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly jobsService: JobsService,
  ) {}

  private async ensureDraftJob(
    payment: JobPayment,
    jobDto: RecordPaymentJobDto,
    userId: string,
  ): Promise<string | null> {
    if (payment.jobId) return payment.jobId;

    const company = await this.companyService.findByAdmin(userId);
    const job = await this.jobsService.create({
      ...jobDto,
      companyId: company.id,
      status: 'draft',
    });

    payment.jobId = job.id;
    await this.paymentRepo.save(payment);
    return job.id;
  }

  private toResponse(payment: JobPayment) {
    return {
      id: payment.id,
      txRef: payment.txRef,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      jobTitle: payment.jobTitle,
      jobId: payment.jobId,
      payerName: payment.payerName,
      payerEmail: payment.payerEmail,
      payerPhone: payment.payerPhone,
      companyId: payment.company?.id,
      companyName: payment.company?.name,
      paidAt: payment.paidAt,
    };
  }

  private applyDateFilters(
    qb: ReturnType<Repository<JobPayment>['createQueryBuilder']>,
    filters: PaymentFilters,
  ) {
    if (filters.fromDate) {
      qb.andWhere('payment.paidAt >= :fromDate', {
        fromDate: new Date(`${filters.fromDate}T00:00:00.000Z`),
      });
    }
    if (filters.toDate) {
      qb.andWhere('payment.paidAt <= :toDate', {
        toDate: new Date(`${filters.toDate}T23:59:59.999Z`),
      });
    }
    return qb;
  }

  async record(dto: RecordPaymentDto, userId: string) {
    const existing = await this.paymentRepo.findOne({
      where: { txRef: dto.txRef },
      relations: ['company'],
    });
    if (existing) {
      if (dto.job) {
        await this.ensureDraftJob(existing, dto.job, userId);
        const refreshed = await this.paymentRepo.findOne({
          where: { txRef: dto.txRef },
          relations: ['company'],
        });
        if (refreshed) return this.toResponse(refreshed);
      }
      return this.toResponse(existing);
    }

    await this.chapaService.verify(dto.txRef);

    const company = await this.companyService.findByAdmin(userId);

    const payment = this.paymentRepo.create({
      txRef: dto.txRef,
      amount: dto.amount,
      currency: dto.currency ?? 'ETB',
      status: 'completed',
      jobTitle: dto.jobTitle,
      payerName: dto.payerName,
      payerEmail: dto.payerEmail,
      payerPhone: dto.payerPhone ?? null,
      company,
      paidBy: { id: userId } as any,
    });

    let saved = await this.paymentRepo.save(payment);
    saved.company = company;

    if (dto.job) {
      await this.ensureDraftJob(saved, dto.job, userId);
      const refreshed = await this.paymentRepo.findOne({
        where: { txRef: dto.txRef },
        relations: ['company'],
      });
      if (refreshed) saved = refreshed;
      saved.company = company;
    }

    const superadmins = await this.usersService.findByRole('superadmin');
    if (superadmins.length > 0) {
      await this.notificationsService.notifySuperadminsPaymentReceived({
        superadminIds: superadmins.map((u) => u.id),
        companyName: company.name,
        jobTitle: dto.jobTitle,
        amount: dto.amount,
        currency: dto.currency ?? 'ETB',
        paymentId: saved.id,
      });
    }

    return this.toResponse(saved);
  }

  async linkJob(txRef: string, jobId: string, userId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { txRef },
      relations: ['company', 'company.admin'],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.company?.admin?.id !== userId) {
      throw new ForbiddenException('Not allowed to update this payment');
    }

    payment.jobId = jobId;
    const saved = await this.paymentRepo.save(payment);
    saved.company = payment.company;
    return this.toResponse(saved);
  }

  async findForCompany(userId: string, filters: PaymentFilters) {
    const company = await this.companyService.findByAdmin(userId);

    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.company', 'company')
      .where('company.id = :companyId', { companyId: company.id })
      .orderBy('payment.paidAt', 'DESC');

    this.applyDateFilters(qb, filters);

    const payments = await qb.getMany();
    return payments.map((p) => this.toResponse(p));
  }

  async findAll(filters: PaymentFilters) {
    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.company', 'company')
      .orderBy('payment.paidAt', 'DESC');

    if (filters.companyId) {
      qb.andWhere('company.id = :companyId', { companyId: filters.companyId });
    }

    this.applyDateFilters(qb, filters);

    const payments = await qb.getMany();
    return payments.map((p) => this.toResponse(p));
  }
}
