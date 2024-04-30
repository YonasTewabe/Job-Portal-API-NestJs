export class CreateJobDto {
    type: string;
    title: string;
    location: string;
    description: string;
    requirement: string;
    salary: string;
    companyName: string;
    companyDescription: string;
    contactEmail: string;
    companyPhone: number;
    deadline: Date;
    userId: string;
}
