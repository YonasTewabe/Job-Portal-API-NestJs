// application.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
  ) {}

  async check(jobid: string, userid: string): Promise<boolean> {
    const existingApplication = await this.applicationRepository.findOne({
      where: { jobid, userid },
    });
    return !!existingApplication;
  }

  async create(createApplicationDto: CreateApplicationDto) {
    const { jobid, userid } = createApplicationDto;
    const hasApplied = await this.check(jobid, userid);
    if (hasApplied) {
      throw new Error('User has already applied to this job');
    }
    const application = this.applicationRepository.create(createApplicationDto);
    return await this.applicationRepository.save(application);
  }

  async findAll() {
    return await this.applicationRepository.find();
  }

  async findOne(id: string) {
    return await this.applicationRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateApplicationDto: UpdateApplicationDto) {
    const application = await this.findOne(id);
    if (!application) {
      throw new NotFoundException();
    }
    Object.assign(application, updateApplicationDto);

    return await this.applicationRepository.save(application);
  }

  async remove(id: string) {
    return await this.applicationRepository.delete(id);
  }
}
