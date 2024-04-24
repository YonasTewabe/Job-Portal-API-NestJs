import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import {v4 as uuidv4} from "uuid";


@Entity({name: 'profile'})
export class Profile {
    @PrimaryGeneratedColumn('uuid')
    id: uuidv4;

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
    
    @Column({ type: 'text', unique: true, nullable: true })
    contactEmail: string
    
    @Column({ type: 'varchar', nullable: true })
    contactPhone: string
    
    @Column({ type: 'varchar', unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', nullable: false })
    password: string;

    @Column({ type: 'text', nullable: true})
    role: string;

    @Column({ type: 'text', nullable: true})
    cv: string;
}
