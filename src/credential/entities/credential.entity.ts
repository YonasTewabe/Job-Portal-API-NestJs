export enum UserType {
  User = 'user',
  HR = 'hr',
}

import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'credential' })
export class Credential {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', nullable: false })
  password: string;

  @Column({ type: 'enum', enum: UserType, nullable: false, default: UserType.User })
  role: UserType;
}
