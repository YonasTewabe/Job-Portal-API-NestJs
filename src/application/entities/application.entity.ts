import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Applicant } from '../../applicant/entities/applicant.entity';
import { Job } from '../../jobs/entities/job.entity';

@Entity({ name: 'applications' })
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  applicationDate: Date;

  @Column({ type: 'varchar', default: 'Pending' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  interviewDate: Date;

  @Column({ type: 'boolean', default: false })
  interviewHasTime: boolean;

  @Column({ type: 'text', nullable: true })
  interviewLocation: string;

  @ManyToOne(() => Applicant, (applicant) => applicant.applications, {
    eager: true,
    nullable: false,
  })
  applicant: Applicant;

  @ManyToOne(() => Job, (job) => job.applications, {
    eager: true,
    nullable: false,
  })
  job: Job;
}
