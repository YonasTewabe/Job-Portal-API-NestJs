import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ChapaService } from './chapa.service';
import { InitiateChapaDto } from './dto/initiate-chapa.dto';

@Controller('chapa')
export class ChapaController {
  constructor(private readonly chapaService: ChapaService) {}

  @Public()
  @Post('initiate')
  initiate(@Body() dto: InitiateChapaDto) {
    return this.chapaService.initiate(dto.encrypted_data);
  }

  @Public()
  @Get('verify')
  verify(@Query('tx_ref') txRef: string) {
    return this.chapaService.verify(txRef);
  }
}
