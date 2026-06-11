import { IsNumber, Min } from 'class-validator';

export class UpdatePricingDto {
  @IsNumber()
  @Min(0)
  jobPostingPrice: number;
}
