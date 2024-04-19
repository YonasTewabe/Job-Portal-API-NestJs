import { UserType } from "../entities/credential.entity";

export class CreateCredentialDto {
    email: string;
    password: string;
    role: UserType.User;
}
