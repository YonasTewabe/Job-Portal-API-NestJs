import { Column, Entity, OneToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Applicant } from '../../applicant/entities/applicant.entity';
import { Company } from '../../company/entities/company.entity';

export type UserRole = 'superadmin' | 'company_admin' | 'user';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar' })
  role: UserRole;

  /** Populated only for users with role = 'user' */
  @OneToMany(() => Applicant, (applicant) => applicant.user, { cascade: true })
  applicants?: Applicant[];

  /** Populated only for users with role = 'company_admin' */
  @OneToOne(() => Company, (company) => company.admin, { nullable: true })
  company?: Company;
}
