import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Application } from '../../application/entities/application.entity';

@Entity({ name: 'jobs' })
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text' })
  location: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  requirement: string;

  @Column({ type: 'text', nullable: true })
  salary: string | null;

  @Column({ type: 'date' })
  deadline: Date;

  @Column({ type: 'varchar', default: 'published' })
  status: 'draft' | 'published';

  @Column({ default: true })
  isOpen: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Company, (company) => company.jobs, {
    eager: true,
    nullable: false,
  })
  company: Company;

  @OneToMany(() => Application, (application) => application.job)
  applications: Application[];
}
