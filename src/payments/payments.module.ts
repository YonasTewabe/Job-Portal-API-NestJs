import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPayment } from './entities/job-payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ChapaModule } from '../chapa/chapa.module';
import { CompanyModule } from '../company/company.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobPayment]),
    ChapaModule,
    CompanyModule,
    NotificationsModule,
    UsersModule,
    JobsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
