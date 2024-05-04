import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export const config: TypeOrmModuleOptions = {
  type: 'postgres',
  url: 'postgres://default:3eQibNS5tLgD@ep-billowing-queen-a45bomrk-pooler.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require',
  // username: 'postgres',
  // password: '1234',
  // port: 5432,
  // host: '127.0.0.1',
  // database: 'capstoneProject',
  synchronize: true,
  entities: ['dist/**/*.entity{.ts,.js}'],

};
