import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfigService } from './config/config.service';

export const ormConfig = (cfg: AppConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: cfg.dbHost,
  port: cfg.dbPort,
  username: cfg.dbUsername,
  password: cfg.dbPassword,
  database: cfg.dbName,
  synchronize: true,
  entities: ['dist/**/*.entity{.ts,.js}'],
});
