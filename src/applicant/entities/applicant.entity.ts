import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Application } from '../../application/entities/application.entity';

export interface EducationEntry {
  degree: string;
  university: string;
  startDate: string;
  endDate?: string;
}

export interface ExperienceEntry {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
}

@Entity({ name: 'applicants' })
export class Applicant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  profileName: string;

  @Column({ type: 'varchar', nullable: true })
  fullname: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'varchar', nullable: true })
  sex: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  educations: EducationEntry[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  experiences: ExperienceEntry[];

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  cv: string;

  @Column({ type: 'boolean', default: false })
  profileCompleted: boolean;

  @ManyToOne(() => User, (user) => user.applicants, { nullable: false })
  user: User;

  @OneToMany(() => Application, (application) => application.applicant)
  applications: Application[];
}
