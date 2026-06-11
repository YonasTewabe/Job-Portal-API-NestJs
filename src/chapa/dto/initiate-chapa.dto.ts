import { IsString } from 'class-validator';

export class InitiateChapaDto {
  @IsString()
  encrypted_data: string;
}
