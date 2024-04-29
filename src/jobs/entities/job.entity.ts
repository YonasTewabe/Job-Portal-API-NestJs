import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {v4 as uuidv4} from 'uuid';


@Entity({ name: 'jobs' })
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: uuidv4;

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

  @Column({ type: 'text' })
  companyName: string;

  @Column({ type: 'text'})
  companyDescription: string;

  @Column({ type: 'text' })
  contactEmail: string;

  @Column({ type: 'varchar' })
  companyPhone: number;

  @Column({ type: 'date' })
  deadline: Date;
}
