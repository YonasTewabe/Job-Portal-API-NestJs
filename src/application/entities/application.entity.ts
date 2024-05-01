import { PrimaryGeneratedColumn, Column, Entity } from "typeorm";
import { v4 as uuidv4} from 'uuid'

@Entity({name: 'Application'})
export class Application {
  
 @PrimaryGeneratedColumn('uuid')
 id: string = uuidv4();

 @Column({type: 'text'})
 companyname: string

 @Column({type: 'text'})
 jobtitle: string; 
 
 @Column({type: 'text'})
 jobid: string;

 @Column({type: 'text'})
 fullname: string;

 @Column({type: 'text'})
 experience: string;

 @Column({type: 'text'})
 degree: string;

 @Column({type: 'text'})
 university: string;

 @Column({type: 'text', nullable: true})
 userid: string;

 @Column({type: 'varchar'})
 contactemail: string;

 @Column({type: 'varchar'})
 userphone: string;

 @Column({type: 'date'})
 applicationdate: Date;

 @Column({type: 'text'})
 status: string;

 @Column({type: 'text'})
 cv: string;

 @Column({type: 'date', nullable: true})
 interviewdate: Date;

}
