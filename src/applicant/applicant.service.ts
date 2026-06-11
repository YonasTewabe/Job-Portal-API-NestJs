import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  private calculateAge(dateOfBirth?: Date | string | null): number | null {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  private formatDateOfBirth(dateOfBirth?: Date | string | null): string {
    if (!dateOfBirth) return '';
    const d = new Date(dateOfBirth);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  private toProfile(applicant: Applicant) {
    const dateOfBirth = this.formatDateOfBirth(applicant.dateOfBirth);
    return {
      id: applicant.id,
      dateOfBirth,
      age: this.calculateAge(applicant.dateOfBirth),
      sex: applicant.sex,
      educations: applicant.educations ?? [],
      experiences: applicant.experiences ?? [],
      phone: applicant.phone,
      cv: applicant.cv,
      profileCompleted: applicant.profileCompleted,
      user: applicant.user,
      fullname: applicant.user?.name ?? '',
      userPhone: applicant.phone ?? '',
      email: applicant.user?.email ?? '',
    };
  }

  private entryHasDates(entry: { startDate?: string }) {
    return Boolean(entry.startDate?.trim());
  }

  /** Get or auto-create the applicant profile for a user */
  async getOrCreate(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['applicant', 'applicant.user'],
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.applicant) {
      if (!user.applicant.user) user.applicant.user = user;
      return this.toProfile(user.applicant);
    }

    const applicant = this.applicantRepo.create({
      user,
      profileCompleted: false,
      educations: [],
      experiences: [],
    });
    const saved = await this.applicantRepo.save(applicant);
    saved.user = user;
    return this.toProfile(saved);
  }

  async findAll() {
    const applicants = await this.applicantRepo.find({ relations: ['user'] });
    return applicants.map((a) => this.toProfile(a));
  }

  async findOne(id: string) {
    const applicant = await this.applicantRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!applicant) throw new NotFoundException('Applicant not found');
    return this.toProfile(applicant);
  }

  async findByUser(userId: string) {
    const applicant = await this.applicantRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!applicant) throw new NotFoundException('Applicant profile not found');
    return this.toProfile(applicant);
  }

  async update(userId: string, dto: UpdateApplicantDto) {
    let applicant = await this.applicantRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!applicant) {
      const user = await this.userRepo.findOneBy({ id: userId });
      if (!user) throw new NotFoundException('User not found');
      applicant = this.applicantRepo.create({
        user,
        profileCompleted: false,
        educations: [],
        experiences: [],
      });
      applicant = await this.applicantRepo.save(applicant);
      applicant.user = user;
    }

    if (dto.fullname && applicant.user) {
      applicant.user.name = dto.fullname;
      await this.userRepo.save(applicant.user);
    }

    if (dto.email && applicant.user) {
      const existing = await this.userRepo.findOneBy({ email: dto.email });
      if (existing && existing.id !== applicant.user.id) {
        throw new ConflictException('Email already in use');
      }
      applicant.user.email = dto.email;
      await this.userRepo.save(applicant.user);
    }

    if (dto.userPhone !== undefined) applicant.phone = dto.userPhone;
    if (dto.educations) applicant.educations = dto.educations;
    if (dto.experiences) applicant.experiences = dto.experiences;
    if (dto.dateOfBirth) applicant.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.sex !== undefined) applicant.sex = dto.sex;
    if (dto.cv !== undefined) applicant.cv = dto.cv;

    const hasEducations =
      Array.isArray(applicant.educations) &&
      applicant.educations.length > 0 &&
      applicant.educations.every(
        (e) => e.degree?.trim() && e.university?.trim() && this.entryHasDates(e),
      );

    const hasExperiences =
      Array.isArray(applicant.experiences) &&
      applicant.experiences.length > 0 &&
      applicant.experiences.every(
        (e) => e.title?.trim() && e.company?.trim() && this.entryHasDates(e),
      );

    if (
      applicant.dateOfBirth &&
      applicant.sex &&
      hasEducations &&
      hasExperiences &&
      applicant.phone &&
      applicant.cv
    ) {
      applicant.profileCompleted = true;
    }

    const saved = await this.applicantRepo.save(applicant);
    saved.user = applicant.user;
    return this.toProfile(saved);
  }
}
