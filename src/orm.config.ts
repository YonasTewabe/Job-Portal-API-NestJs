import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export const config: TypeOrmModuleOptions = {
  type: 'postgres',
  username: 'postgres',
  // password: 'postgres',
  password: '1234',
  port: 5432,
  host: 'localhost',
  database: 'capstone',
  // host: '127.0.0.1',
  // database: 'capstoneProject',
  synchronize: true,
  entities: ['dist/**/*.entity{.ts,.js}'],
};
