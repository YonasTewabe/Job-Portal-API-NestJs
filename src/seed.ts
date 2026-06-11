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

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Connected to database');

  const userRepo = AppDataSource.getRepository(User);

  // Clear all tables in dependency order
  await AppDataSource.getRepository(Application).delete({});
  await AppDataSource.getRepository(Job).delete({});
  await AppDataSource.getRepository(Applicant).delete({});
  await AppDataSource.getRepository(Company).delete({});
  await userRepo.delete({});
  console.log('🗑️  Cleared existing data');

  // Check if superadmin already exists to avoid duplicates on re-run
  const existing = await userRepo.findOneBy({ email: 'superadmin@jobportal.com' });
  if (existing) {
    console.log('👑 Superadmin already exists — skipping');
    await AppDataSource.destroy();
    return;
  }

  const superadmin = userRepo.create({
    name: 'Super Admin',
    email: 'superadmin@jobportal.com',
    password: await bcrypt.hash('Password123!', 12),
    role: 'superadmin',
  });
  await userRepo.save(superadmin);

  await AppDataSource.destroy();

  console.log('\n🌱 Seed complete!');
  console.log('──────────────────────────────────────');
  console.log('  Email:    superadmin@jobportal.com');
  console.log('  Password: Password123!');
  console.log('  Role:     superadmin');
  console.log('──────────────────────────────────────');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
