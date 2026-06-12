import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Applicant } from './entities/applicant.entity';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { CreateApplicantProfileDto } from './dto/create-applicant-profile.dto';
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
      profileName: applicant.profileName ?? 'Default Profile',
      dateOfBirth,
      age: this.calculateAge(applicant.dateOfBirth),
      sex: applicant.sex,
      educations: applicant.educations ?? [],
      experiences: applicant.experiences ?? [],
      phone: applicant.phone,
      cv: applicant.cv,
      profileCompleted: applicant.profileCompleted,
      user: applicant.user,
      fullname: applicant.fullname ?? applicant.user?.name ?? '',
      userPhone: applicant.phone ?? '',
      email: applicant.email ?? applicant.user?.email ?? '',
    };
  }

  private entryHasDates(entry: { startDate?: string }) {
    return Boolean(entry.startDate?.trim());
  }

  private async getUserOrThrow(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async findOwnedProfile(userId: string, profileId: string) {
    const applicant = await this.applicantRepo.findOne({
      where: { id: profileId, user: { id: userId } },
      relations: ['user'],
    });
    if (!applicant) throw new NotFoundException('Profile not found');
    return applicant;
  }

  private defaultProfileName(count: number) {
    return count === 0 ? 'Default Profile' : `Profile ${count + 1}`;
  }

  private createBlankApplicant(user: User, profileName: string) {
    return this.applicantRepo.create({
      user,
      profileName,
      fullname: user.name ?? '',
      email: user.email ?? '',
      profileCompleted: false,
      educations: [],
      experiences: [],
    });
  }

  /** List all applicant profiles for a user */
  async listByUser(userId: string) {
    const applicants = await this.applicantRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { profileName: 'ASC' },
    });
    return applicants.map((a) => this.toProfile(a));
  }

  /** Get or auto-create the default applicant profile for a user */
  async getOrCreate(userId: string) {
    const applicants = await this.applicantRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { profileName: 'ASC' },
      take: 1,
    });

    if (applicants.length > 0) {
      const applicant = applicants[0];
      if (!applicant.user) {
        applicant.user = await this.getUserOrThrow(userId);
      }
      await this.backfillProfileFields(applicant);
      return this.toProfile(applicant);
    }

    const user = await this.getUserOrThrow(userId);
    const applicant = await this.applicantRepo.save(
      this.createBlankApplicant(user, this.defaultProfileName(0)),
    );
    applicant.user = user;
    return this.toProfile(applicant);
  }

  private async backfillProfileFields(applicant: Applicant) {
    let changed = false;
    if (!applicant.fullname && applicant.user?.name) {
      applicant.fullname = applicant.user.name;
      changed = true;
    }
    if (!applicant.email && applicant.user?.email) {
      applicant.email = applicant.user.email;
      changed = true;
    }
    if (!applicant.profileName) {
      applicant.profileName = this.defaultProfileName(0);
      changed = true;
    }
    if (changed) {
      await this.applicantRepo.save(applicant);
    }
  }

  async createProfile(userId: string, dto: CreateApplicantProfileDto = {}) {
    const user = await this.getUserOrThrow(userId);
    const count = await this.applicantRepo.count({
      where: { user: { id: userId } },
    });
    const profileName =
      dto.profileName?.trim() || this.defaultProfileName(count);

    const applicant = await this.applicantRepo.save(
      this.createBlankApplicant(user, profileName),
    );
    applicant.user = user;
    return this.toProfile(applicant);
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
    return this.getOrCreate(userId);
  }

  async findProfileByUser(userId: string, profileId: string) {
    const applicant = await this.findOwnedProfile(userId, profileId);
    return this.toProfile(applicant);
  }

  private async getDefaultProfile(userId: string) {
    const profiles = await this.applicantRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { profileName: 'ASC' },
      take: 1,
    });
    if (profiles[0]) return profiles[0];

    const user = await this.getUserOrThrow(userId);
    return this.applicantRepo.save(
      this.createBlankApplicant(user, this.defaultProfileName(0)),
    );
  }

  async update(userId: string, dto: UpdateApplicantDto, profileId?: string) {
    const applicant = profileId
      ? await this.findOwnedProfile(userId, profileId)
      : await this.getDefaultProfile(userId);

    if (!applicant.user) {
      applicant.user = await this.getUserOrThrow(userId);
    }

    if (dto.profileName?.trim()) applicant.profileName = dto.profileName.trim();
    if (dto.fullname !== undefined) applicant.fullname = dto.fullname;
    if (dto.email !== undefined) applicant.email = dto.email;
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
        (e) =>
          e.degree?.trim() && e.university?.trim() && this.entryHasDates(e),
      );

    const hasExperiences =
      Array.isArray(applicant.experiences) &&
      applicant.experiences.length > 0 &&
      applicant.experiences.every(
        (e) => e.title?.trim() && e.company?.trim() && this.entryHasDates(e),
      );

    applicant.profileCompleted = Boolean(
      applicant.fullname?.trim() &&
        applicant.email?.trim() &&
        applicant.dateOfBirth &&
        applicant.sex &&
        hasEducations &&
        hasExperiences &&
        applicant.phone &&
        applicant.cv,
    );

    const saved = await this.applicantRepo.save(applicant);

    const profileCount = await this.applicantRepo.count({
      where: { user: { id: userId } },
    });
    if (profileCount === 1 && dto.fullname?.trim() && applicant.user) {
      applicant.user.name = dto.fullname.trim();
      await this.userRepo.save(applicant.user);
    }

    saved.user = applicant.user;
    return this.toProfile(saved);
  }

  async deleteProfile(userId: string, profileId: string) {
    const profiles = await this.applicantRepo.find({
      where: { user: { id: userId } },
      relations: ['applications'],
    });

    if (profiles.length <= 1) {
      throw new BadRequestException('You must keep at least one profile');
    }

    const target = profiles.find((p) => p.id === profileId);
    if (!target) throw new NotFoundException('Profile not found');

    if (target.applications?.length) {
      throw new ConflictException(
        'Cannot delete a profile that has job applications',
      );
    }

    await this.applicantRepo.remove(target);
  }
}
