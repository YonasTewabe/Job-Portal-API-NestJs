import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  // ── App ──────────────────────────────────────────────────────────────────
  get port(): number {
    return this.config.get<number>('PORT') ?? 3000;
  }

  get corsOrigin(): string {
    return this.config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000';
  }

  // ── Database ─────────────────────────────────────────────────────────────
  get dbHost(): string {
    return this.config.get<string>('DB_HOST') ?? 'localhost';
  }

  get dbPort(): number {
    return this.config.get<number>('DB_PORT') ?? 5432;
  }

  get dbUsername(): string {
    return this.config.get<string>('DB_USERNAME') ?? 'postgres';
  }

  get dbPassword(): string {
    return this.config.get<string>('DB_PASSWORD');
  }

  get dbName(): string {
    return this.config.get<string>('DB_NAME');
  }

  // ── JWT ───────────────────────────────────────────────────────────────────
  get jwtSecret(): string {
    return this.config.get<string>('JWT_SECRET');
  }
}
