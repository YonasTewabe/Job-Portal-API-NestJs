import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Profile } from './profile/entities/profile.entity';
import { Job } from './jobs/entities/job.entity';
import { Application } from './application/entities/application.entity';

// ─── Data Source ─────────────────────────────────────────────────────────────

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  entities: [Profile, Job, Application],
});

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Connected to database');

  const profileRepo = AppDataSource.getRepository(Profile);
  const jobRepo = AppDataSource.getRepository(Job);
  const applicationRepo = AppDataSource.getRepository(Application);

  // ── Clear existing data (order matters for FK safety) ──────────────────────
  await applicationRepo.delete({});
  await jobRepo.delete({});
  await profileRepo.delete({});
  console.log('🗑️  Cleared existing data');

  // ── Profiles ───────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Password123!', 12);

  const hrProfile = profileRepo.create({
    fullname: 'Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    password: hashedPassword,
    role: 'hr',
    companyname: 'TechCorp Solutions',
    companydescription: 'A leading software company specializing in enterprise solutions.',
    contactemail: 'hr@techcorp.com',
    companyPhone: '+1-555-100-2000',
    hrdataCompleted: true,
    userdataCompleted: false,
    hrStatus: true,
  });

  const hrProfile2 = profileRepo.create({
    fullname: 'David Lee',
    email: 'david.lee@innovatehq.com',
    password: hashedPassword,
    role: 'hr',
    companyname: 'Innovate HQ',
    companydescription: 'A startup accelerator and product development firm.',
    contactemail: 'hr@innovatehq.com',
    companyPhone: '+1-555-300-4000',
    hrdataCompleted: true,
    userdataCompleted: false,
    hrStatus: true,
  });

  const userProfile1 = profileRepo.create({
    fullname: 'Alice Mekonnen',
    email: 'alice.mekonnen@gmail.com',
    password: hashedPassword,
    role: 'user',
    age: '26',
    sex: 'Female',
    degree: "Bachelor's in Computer Science",
    university: 'Addis Ababa University',
    experience: '2 years as a frontend developer at a local startup.',
    userPhone: '+251-911-000-001',
    cv: 'alice_mekonnen_cv.pdf',
    userdataCompleted: true,
    hrdataCompleted: false,
    hrStatus: false,
  });

  const userProfile2 = profileRepo.create({
    fullname: 'Bereket Tadesse',
    email: 'bereket.tadesse@gmail.com',
    password: hashedPassword,
    role: 'user',
    age: '29',
    sex: 'Male',
    degree: "Master's in Software Engineering",
    university: 'Jimma University',
    experience: '4 years as a backend developer focusing on Node.js and PostgreSQL.',
    userPhone: '+251-911-000-002',
    cv: 'bereket_tadesse_cv.pdf',
    userdataCompleted: true,
    hrdataCompleted: false,
    hrStatus: false,
  });

  const userProfile3 = profileRepo.create({
    fullname: 'Chaltu Fikadu',
    email: 'chaltu.fikadu@gmail.com',
    password: hashedPassword,
    role: 'user',
    age: '24',
    sex: 'Female',
    degree: "Bachelor's in Information Systems",
    university: 'Hawassa University',
    experience: '1 year internship in UI/UX design.',
    userPhone: '+251-911-000-003',
    cv: 'chaltu_fikadu_cv.pdf',
    userdataCompleted: true,
    hrdataCompleted: false,
    hrStatus: false,
  });

  const [savedHr1, savedHr2, savedUser1, savedUser2, savedUser3] =
    await profileRepo.save([hrProfile, hrProfile2, userProfile1, userProfile2, userProfile3]);

  console.log('👤 Profiles seeded');

  // ── Jobs ───────────────────────────────────────────────────────────────────
  const job1 = jobRepo.create({
    title: 'Frontend Developer',
    type: 'Full-time',
    location: 'Addis Ababa, Ethiopia',
    description: 'Build and maintain modern web interfaces using React and TypeScript.',
    requirement: 'Proficiency in React, TypeScript, CSS. Experience with REST APIs.',
    salary: '$1,200 - $1,800 / month',
    companyName: savedHr1.companyname,
    companyDescription: savedHr1.companydescription,
    contactEmail: savedHr1.contactemail,
    companyPhone: savedHr1.companyPhone as any,
    deadline: new Date('2026-08-01'),
    userId: savedHr1.id as string,
  });

  const job2 = jobRepo.create({
    title: 'Backend Engineer',
    type: 'Full-time',
    location: 'Remote',
    description: 'Design and develop scalable REST APIs using NestJS and PostgreSQL.',
    requirement: 'NestJS, TypeORM, PostgreSQL, Docker. 3+ years of experience.',
    salary: '$1,500 - $2,500 / month',
    companyName: savedHr1.companyname,
    companyDescription: savedHr1.companydescription,
    contactEmail: savedHr1.contactemail,
    companyPhone: savedHr1.companyPhone as any,
    deadline: new Date('2026-07-15'),
    userId: savedHr1.id as string,
  });

  const job3 = jobRepo.create({
    title: 'UI/UX Designer',
    type: 'Part-time',
    location: 'Addis Ababa, Ethiopia',
    description: 'Create wireframes, prototypes, and design systems for web and mobile apps.',
    requirement: 'Figma, Adobe XD, user research experience. Portfolio required.',
    salary: '$800 - $1,200 / month',
    companyName: savedHr2.companyname,
    companyDescription: savedHr2.companydescription,
    contactEmail: savedHr2.contactemail,
    companyPhone: savedHr2.companyPhone as any,
    deadline: new Date('2026-09-01'),
    userId: savedHr2.id as string,
  });

  const job4 = jobRepo.create({
    title: 'Product Manager',
    type: 'Full-time',
    location: 'Nairobi, Kenya',
    description: 'Lead cross-functional teams to deliver software products on time.',
    requirement: 'Agile, JIRA, 5+ years in product management. MBA is a plus.',
    salary: '$2,000 - $3,000 / month',
    companyName: savedHr2.companyname,
    companyDescription: savedHr2.companydescription,
    contactEmail: savedHr2.contactemail,
    companyPhone: savedHr2.companyPhone as any,
    deadline: new Date('2026-08-20'),
    userId: savedHr2.id as string,
  });

  const [savedJob1, savedJob2, savedJob3] = await jobRepo.save([job1, job2, job3, job4]);
  console.log('💼 Jobs seeded');

  // ── Applications ───────────────────────────────────────────────────────────
  const app1 = applicationRepo.create({
    companyname: savedJob1.companyName,
    jobtitle: savedJob1.title,
    jobid: savedJob1.id as string,
    fullname: savedUser1.fullname,
    experience: savedUser1.experience,
    degree: savedUser1.degree,
    university: savedUser1.university,
    userid: savedUser1.id as string,
    contactemail: savedUser1.email,
    userphone: savedUser1.userPhone,
    applicationdate: new Date(),
    status: 'Pending',
    cv: savedUser1.cv,
    interviewDate: null,
    interviewLocation: null,
  });

  const app2 = applicationRepo.create({
    companyname: savedJob2.companyName,
    jobtitle: savedJob2.title,
    jobid: savedJob2.id as string,
    fullname: savedUser2.fullname,
    experience: savedUser2.experience,
    degree: savedUser2.degree,
    university: savedUser2.university,
    userid: savedUser2.id as string,
    contactemail: savedUser2.email,
    userphone: savedUser2.userPhone,
    applicationdate: new Date(),
    status: 'Reviewed',
    cv: savedUser2.cv,
    interviewDate: new Date('2026-06-20'),
    interviewLocation: 'TechCorp Office, Addis Ababa',
  });

  const app3 = applicationRepo.create({
    companyname: savedJob3.companyName,
    jobtitle: savedJob3.title,
    jobid: savedJob3.id as string,
    fullname: savedUser3.fullname,
    experience: savedUser3.experience,
    degree: savedUser3.degree,
    university: savedUser3.university,
    userid: savedUser3.id as string,
    contactemail: savedUser3.email,
    userphone: savedUser3.userPhone,
    applicationdate: new Date(),
    status: 'Accepted',
    cv: savedUser3.cv,
    interviewDate: new Date('2026-06-15'),
    interviewLocation: 'Innovate HQ, Addis Ababa',
  });

  const app4 = applicationRepo.create({
    companyname: savedJob1.companyName,
    jobtitle: savedJob1.title,
    jobid: savedJob1.id as string,
    fullname: savedUser2.fullname,
    experience: savedUser2.experience,
    degree: savedUser2.degree,
    university: savedUser2.university,
    userid: savedUser2.id as string,
    contactemail: savedUser2.email,
    userphone: savedUser2.userPhone,
    applicationdate: new Date(),
    status: 'Rejected',
    cv: savedUser2.cv,
    interviewDate: null,
    interviewLocation: null,
  });

  await applicationRepo.save([app1, app2, app3, app4]);
  console.log('📋 Applications seeded');

  await AppDataSource.destroy();
  console.log('\n🌱 Seed complete!');
  console.log('─────────────────────────────────────────');
  console.log('  2 HR accounts  |  3 User accounts');
  console.log('  4 Jobs         |  4 Applications');
  console.log('  Login password for all accounts: Password123!');
  console.log('─────────────────────────────────────────');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
