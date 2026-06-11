import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PricingService } from './pricing.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Public()
  @Get()
  getPricing() {
    return this.pricingService.getPricing();
  }

  @Patch()
  @Roles('superadmin')
  updatePricing(@Body() dto: UpdatePricingDto) {
    return this.pricingService.updatePricing(dto);
  }
}
