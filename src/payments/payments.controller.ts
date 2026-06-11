import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('record')
  @Roles('company_admin')
  record(
    @CurrentUser() user: { id: string },
    @Body() dto: RecordPaymentDto,
  ) {
    return this.paymentsService.record(dto, user.id);
  }

  @Patch(':txRef/job/:jobId')
  @Roles('company_admin')
  linkJob(
    @Param('txRef') txRef: string,
    @Param('jobId') jobId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.paymentsService.linkJob(txRef, jobId, user.id);
  }

  @Get('mine')
  @Roles('company_admin')
  findMine(
    @CurrentUser() user: { id: string },
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
  ) {
    return this.paymentsService.findForCompany(user.id, { fromDate, toDate });
  }

  @Get()
  @Roles('superadmin')
  findAll(
    @Query('companyId') companyId?: string,
    @Query('from') fromDate?: string,
    @Query('to') toDate?: string,
  ) {
    return this.paymentsService.findAll({ companyId, fromDate, toDate });
  }
}
