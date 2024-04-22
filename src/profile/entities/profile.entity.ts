import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity({name: 'profile'})
export class Profile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text', nullable: true })
    fullname: string
    
    @Column({nullable: true})
    age: string
    
    @Column({ type: 'text', nullable: true})
    sex: string;
    
    @Column({ type: 'text', nullable: true })
    degree: string
    
    @Column({ type: 'text', nullable: true })
    university: string
    
    @Column({ type: 'text', nullable: true })
    experience: string
    
    @Column({ type: 'text', nullable: true })
    contactEmail: string
    
    @Column({ type: 'varchar', nullable: true })
    contactPhone: string
    
    @Column({ type: 'varchar', nullable: false })
    email: string;

    @Column({ type: 'varchar', nullable: false })
    password: string;

    @Column({ type: 'text', nullable: true})
    role: string;
}
