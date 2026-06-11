import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformPricing } from './entities/platform-pricing.entity';
import { UpdatePricingDto } from './dto/update-pricing.dto';

const DEFAULT_PRICE = 100;

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PlatformPricing)
    private readonly pricingRepo: Repository<PlatformPricing>,
  ) {}

  async getPricing(): Promise<PlatformPricing> {
    let pricing = await this.pricingRepo.findOne({ where: { id: 1 } });
    if (!pricing) {
      pricing = this.pricingRepo.create({
        id: 1,
        jobPostingPrice: DEFAULT_PRICE,
        currency: 'ETB',
      });
      pricing = await this.pricingRepo.save(pricing);
    }
    return pricing;
  }

  async updatePricing(dto: UpdatePricingDto): Promise<PlatformPricing> {
    const pricing = await this.getPricing();
    pricing.jobPostingPrice = dto.jobPostingPrice;
    return this.pricingRepo.save(pricing);
  }
}
