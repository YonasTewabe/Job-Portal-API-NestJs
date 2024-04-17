import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'user'})
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ type: 'text' })
    fullname: string
    @Column()
    age: number
    @Column({ type: 'text' })
    sex: string
    @Column({ type: 'text' })
    degree: string
    @Column({ type: 'text' })
    university: string
    @Column({ type: 'text' })
    experience: string
    @Column({ type: 'text' })
    contactEmail: string
    @Column({ type: 'varchar' })
    contactPhone: string
}
