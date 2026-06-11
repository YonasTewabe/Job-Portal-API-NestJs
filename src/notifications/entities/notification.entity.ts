import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type NotificationType =
  | 'application_received'
  | 'application_status'
  | 'interview_scheduled'
  | 'interview_updated'
  | 'job_closed'
  | 'payment_received';

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @Column({ type: 'varchar' })
  type: NotificationType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', nullable: true })
  linkPath: string | null;

  @Column({ type: 'uuid', nullable: true })
  referenceId: string | null;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
