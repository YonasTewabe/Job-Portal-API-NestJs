import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
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

  @Column({ type: 'text' })
  salary: string;

  @Column({ type: 'date' })
  deadline: Date;

  @ManyToOne(() => Company, (company) => company.jobs, { eager: true, nullable: false })
  company: Company;

  @OneToMany(() => Application, (application) => application.job)
  applications: Application[];
}
