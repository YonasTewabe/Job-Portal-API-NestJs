export enum UserSex {
    Male = 'male',
    Female = 'female',
  }

import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'user'})
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ type: 'text' })
    fullname: string
    @Column()
    age: number
    @Column({ type: 'enum', enum: UserSex})
    sex: UserSex;
    @Column({ type: 'text' })
    degree: string
    @Column({ type: 'text' })
    university: string
    @Column({ type: 'text' })
    experience: string
    @Column({ type: 'text', unique: true })
    contactEmail: string
    @Column({ type: 'varchar' })
    contactPhone: string
}
