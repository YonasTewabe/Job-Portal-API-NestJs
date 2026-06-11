import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPayment } from './entities/job-payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ChapaModule } from '../chapa/chapa.module';
import { CompanyModule } from '../company/company.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobPayment]),
    ChapaModule,
    CompanyModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
