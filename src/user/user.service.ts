import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
constructor(
  @InjectRepository(User)
  private readonly userRepository: Repository<User>){

}

  async create(createUserDto: CreateUserDto) {
   const user = this.userRepository.create(createUserDto)
    return await this.userRepository.save(user);
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: number) {
    return await this.userRepository.findOne({
      where: { id }
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if(!user){
      throw new NotFoundException()
    }
    Object.assign(user, updateUserDto)

    return await this.userRepository.save(user)
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if(!user){
      throw new NotFoundException()
    }
    return await this.userRepository.remove(user)
  }
}
