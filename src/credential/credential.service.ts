import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credential } from './entities/credential.entity';


@Injectable()
export class CredentialService {
  constructor(
    @InjectRepository(Credential) private readonly credentialRepository: Repository<Credential>
  ){

  }

  async create(data: any): Promise<Credential>{
    return this.credentialRepository.save(data)
  }
  async findOneBy(condition: any):  Promise<Credential>{
    return this.credentialRepository.findOneBy(condition)
  }
}
