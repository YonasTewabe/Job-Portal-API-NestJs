import { PrimaryGeneratedColumn, Column, Entity } from "typeorm";
import { v4 as uuidv4} from 'uuid'

@Entity({name: 'Application'})
export class Application {
  
 @PrimaryGeneratedColumn('uuid')
 id: string = uuidv4;

 @Column({type: 'text'})
 companyname: string

 @Column({type: 'text'})
 jobtitle: string;

 @Column({type: 'text'})
 fullname: string;

 @Column({type: 'date'})
 applicationdate: Date;

 @Column({type: 'text'})
 status: string;
}
