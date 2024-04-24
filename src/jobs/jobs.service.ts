import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>){

  }
  async create(createJobDto: CreateJobDto) {
    const job = this.jobsRepository.create(createJobDto)
    
    return await this.jobsRepository.save(job);
  }

  async findAll() {
    return await this.jobsRepository.find();
  }

  async findOne(id: string) {
    return await this.jobsRepository.findOne({
      where: { id }
    });
  }

  async update(id: string, updateJobDto: UpdateJobDto) {
    const job = await this.findOne(id);
    if(!job){
      throw new NotFoundException()
    }
    Object.assign(job, updateJobDto)

    return await this.jobsRepository.save(job)
  }

  async remove(id: string) {
    const job = await this.findOne(id);
    if(!job){
      throw new NotFoundException()
    }
    return await this.jobsRepository.remove(job)
  }
}
