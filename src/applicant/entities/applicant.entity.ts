import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Application } from '../../application/entities/application.entity';

@Entity({ name: 'applicants' })
export class Applicant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  age: string;

  @Column({ type: 'varchar', nullable: true })
  sex: string;

  @Column({ type: 'text', nullable: true })
  degree: string;

  @Column({ type: 'text', nullable: true })
  university: string;

  @Column({ type: 'text', nullable: true })
  experience: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  cv: string;

  @Column({ type: 'boolean', default: false })
  profileCompleted: boolean;

  @OneToOne(() => User, (user) => user.applicant)
  @JoinColumn()
  user: User;

  @OneToMany(() => Application, (application) => application.applicant)
  applications: Application[];
}
