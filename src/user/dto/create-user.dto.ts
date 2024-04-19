import { UserSex } from "../entities/user.entity";

export class CreateUserDto {
    fullname: string;
    age: number;
    sex: UserSex;
    degree: string;
    university: string;
    experience: string;
    contactEmail: string;
    contactPhone: string;
}
