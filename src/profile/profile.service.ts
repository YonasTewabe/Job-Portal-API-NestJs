import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProfileService {
  constructor (
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>){}
  
  async create(createProfileDto: CreateProfileDto) {
    const profile = this.profileRepository.create(createProfileDto)
    return await this.profileRepository.save(profile)
  }
  async findOneBy(condition: any):  Promise<Profile>{
    return this.profileRepository.findOneBy(condition)
  }
  async findAll() {
    return await this.profileRepository.find();
  }

  async findOne(id: number) {
    return await this.profileRepository.findOne({
      where: { id }
    });
  }

  async update(id: number, updateProfileDto: UpdateProfileDto) {
    const profile = await this.findOne(id);
    if(!profile){
      throw new NotFoundException()
    }
    Object.assign(profile, updateProfileDto)

    return await this.profileRepository.save(profile)
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if(!user){
      throw new NotFoundException()
    }
    return await this.profileRepository.remove(user)
  }
}
