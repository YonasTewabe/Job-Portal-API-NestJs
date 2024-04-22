import { PrimaryGeneratedColumn, Column, Entity } from "typeorm";

@Entity({name: 'Application'})
export class Application {
  
 @PrimaryGeneratedColumn()
 id: number;

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
