import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'job_payments' })
export class JobPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  txRef: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', default: 'ETB' })
  currency: string;

  @Column({ type: 'varchar', default: 'completed' })
  status: string;

  @Column({ type: 'varchar' })
  jobTitle: string;

  @Column({ type: 'uuid', nullable: true })
  jobId: string | null;

  @Column({ type: 'varchar' })
  payerName: string;

  @Column({ type: 'varchar' })
  payerEmail: string;

  @Column({ type: 'varchar', nullable: true })
  payerPhone: string | null;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paid_by_id' })
  paidBy: User;

  @CreateDateColumn({ type: 'timestamptz' })
  paidAt: Date;
}
