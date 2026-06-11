import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Applicant } from './entities/applicant.entity';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ApplicantService {
  constructor(
    @InjectRepository(Applicant)
    private readonly applicantRepo: Repository<Applicant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** Get or auto-create the applicant profile for a user */
  async getOrCreate(userId: string): Promise<Applicant> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['applicant'],
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.applicant) return user.applicant;

    const applicant = this.applicantRepo.create({ user, profileCompleted: false });
    return this.applicantRepo.save(applicant);
  }

  async findAll(): Promise<Applicant[]> {
    return this.applicantRepo.find({ relations: ['user'] });
  }

  async findOne(id: string): Promise<Applicant> {
    const applicant = await this.applicantRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!applicant) throw new NotFoundException('Applicant not found');
    return applicant;
  }

  async findByUser(userId: string): Promise<Applicant> {
    const applicant = await this.applicantRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!applicant) throw new NotFoundException('Applicant profile not found');
    return applicant;
  }

  async update(userId: string, dto: UpdateApplicantDto): Promise<Applicant> {
    const applicant = await this.getOrCreate(userId);

    Object.assign(applicant, dto);

    // Auto-flag profile completion when all required fields are filled
    if (
      applicant.age &&
      applicant.sex &&
      applicant.degree &&
      applicant.university &&
      applicant.experience &&
      applicant.phone &&
      applicant.cv
    ) {
      applicant.profileCompleted = true;
    }

    return this.applicantRepo.save(applicant);
  }
}
