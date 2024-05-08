import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { join } from 'path';
// import { unlink } from 'fs';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async create(createProfileDto: CreateProfileDto) {
    const profile = this.profileRepository.create(createProfileDto);
    return await this.profileRepository.save(profile);
  }


  async findOneBy(condition: any): Promise<Profile> {
    return this.profileRepository.findOneBy(condition);
  }

  
  async findAll() {
    return await this.profileRepository.find();
  }

  async findOne(id: string) {
    return await this.profileRepository.findOne({
      where: { id },
    });
  }

  async updateByEmail(email: string) {
    return await this.profileRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateProfileDto: UpdateProfileDto) {
    const profile = await this.findOne(id);
    if (!profile) {
      throw new NotFoundException();
    }
    Object.assign(profile, updateProfileDto);

    return await this.profileRepository.save(profile);
  }

  async change(email: string, updateProfileDto: UpdateProfileDto) {
    const profile = await this.updateByEmail(email);
    if (!profile) {
      throw new NotFoundException();
    }
    Object.assign(profile, updateProfileDto);

    return await this.profileRepository.save(profile);
  }

  async remove(id: string): Promise<void> {
    const profile = await this.findOne(id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }


      // const filePath = join(__dirname, '..', './uploads/', profile.cv);
      // unlink(filePath, (err) => {
      //   if (err) {
      //     console.error('Error deleting file:', err);
      //   }
      // });
    await this.profileRepository.remove(profile);
  }
}
