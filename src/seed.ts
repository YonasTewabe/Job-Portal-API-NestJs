/* eslint-disable no-console */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './users/entities/user.entity';
import { Company } from './company/entities/company.entity';
import { Applicant } from './applicant/entities/applicant.entity';
import { Job } from './jobs/entities/job.entity';
import { Application } from './application/entities/application.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  entities: [User, Company, Applicant, Job, Application],
});

const HASH_ROUNDS = 12;

const deadline = (daysFromNow: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
};

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Connected to database');

  const userRepo = AppDataSource.getRepository(User);
  const companyRepo = AppDataSource.getRepository(Company);
  const applicantRepo = AppDataSource.getRepository(Applicant);
  const jobRepo = AppDataSource.getRepository(Job);
  const applicationRepo = AppDataSource.getRepository(Application);

  // ── Superadmin ────────────────────────────────────────────────────────────
  await userRepo.save(
    userRepo.create({
      name: 'Super Admin',
      email: 'superadmin@jobportal.com',
      password: await bcrypt.hash('Password123!', HASH_ROUNDS),
      role: 'superadmin',
    }),
  );

  // ── Company admin user ────────────────────────────────────────────────────
  const companyAdmin = await userRepo.save(
    userRepo.create({
      name: 'Abebe Girma',
      email: 'admin@techcorp.com',
      password: await bcrypt.hash('Password123!', HASH_ROUNDS),
      role: 'company_admin',
    }),
  );

  // ── Company ───────────────────────────────────────────────────────────────
  const company = await companyRepo.save(
    companyRepo.create({
      name: 'TechCorp Ethiopia',
      description:
        'A leading software company based in Addis Ababa, building products for the African market.',
      contactEmail: 'contact@techcorp.com',
      phone: '0911234567',
      isActive: true,
      admin: companyAdmin,
    }),
  );

  // ── Job seeker (user) ─────────────────────────────────────────────────────
  const jobSeeker = await userRepo.save(
    userRepo.create({
      name: 'Selam Tadesse',
      email: 'selam@example.com',
      password: await bcrypt.hash('Password123!', HASH_ROUNDS),
      role: 'user',
    }),
  );

  // ── Applicant profile ─────────────────────────────────────────────────────
  const applicant = await applicantRepo.save(
    applicantRepo.create({
      user: jobSeeker,
      profileName: 'Default Profile',
      fullname: 'Selam Tadesse',
      email: 'selam@example.com',
      phone: '0922345678',
      sex: 'Female',
      dateOfBirth: new Date('1998-04-15'),
      educations: [
        {
          degree: 'BSc Computer Science',
          university: 'Addis Ababa University',
          startDate: '2016-09',
          endDate: '2020-07',
        },
      ],
      experiences: [
        {
          title: 'Junior Developer',
          company: 'Startup Hub',
          startDate: '2020-09',
          endDate: '2022-06',
        },
      ],
      profileCompleted: true,
    }),
  );

  // ── Jobs ───────────────────────────────────────────────────────────────────
  const job1 = await jobRepo.save(
    jobRepo.create({
      title: 'Full-Stack Developer',
      type: 'Full-Time',
      location: 'Addis Ababa',
      description:
        'Build and maintain scalable web applications using React and NestJS. Work closely with the product team to deliver features.',
      requirement:
        'BSc in Computer Science or related field. 2+ years experience with React and Node.js.',
      salary: '25,000 – 35,000 ETB',
      deadline: deadline(30),
      status: 'published',
      isOpen: true,
      company,
    }),
  );

  const job2 = await jobRepo.save(
    jobRepo.create({
      title: 'UI/UX Designer',
      type: 'Part-Time',
      location: 'Remote',
      description:
        'Design intuitive user interfaces for our mobile and web products. Conduct user research and create prototypes.',
      requirement:
        'Portfolio of UI/UX work required. Proficiency in Figma. Experience with design systems is a plus.',
      salary: null,
      deadline: deadline(21),
      status: 'published',
      isOpen: true,
      company,
    }),
  );

  await jobRepo.save(
    jobRepo.create({
      title: 'DevOps Engineer',
      type: 'Full-Time',
      location: 'Addis Ababa',
      description:
        'Manage CI/CD pipelines, cloud infrastructure, and deployment processes across our platform.',
      requirement:
        'Experience with Docker, Kubernetes, and AWS or GCP. Strong scripting skills (Bash/Python).',
      salary: '30,000 – 40,000 ETB',
      deadline: deadline(14),
      status: 'published',
      isOpen: true,
      company,
    }),
  );

  // ── Application ───────────────────────────────────────────────────────────
  await applicationRepo.save(
    applicationRepo.create({
      applicant,
      job: job1,
      status: 'Pending',
      applicationDate: new Date(),
    }),
  );

  await applicationRepo.save(
    applicationRepo.create({
      applicant,
      job: job2,
      status: 'Under Consideration',
      applicationDate: new Date(),
    }),
  );

  await AppDataSource.destroy();

  console.log('\n🌱 Seed complete!');
  console.log('──────────────────────────────────────────────────');
  console.log('  👑 Superadmin');
  console.log('     Email:    superadmin@jobportal.com');
  console.log('     Password: Password123!');
  console.log('');
  console.log('  🏢 Company admin  (company: TechCorp Ethiopia)');
  console.log('     Email:    admin@techcorp.com');
  console.log('     Password: Password123!');
  console.log('');
  console.log('  👤 Job seeker');
  console.log('     Email:    selam@example.com');
  console.log('     Password: Password123!');
  console.log('──────────────────────────────────────────────────');
  console.log('  3 jobs · 2 applications seeded');
  console.log('──────────────────────────────────────────────────');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
