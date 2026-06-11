import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'platform_pricing' })
export class PlatformPricing {
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 100 })
  jobPostingPrice: number;

  @Column({ default: 'ETB' })
  currency: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
