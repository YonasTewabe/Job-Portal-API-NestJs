import { Module } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CredentialController } from './credential.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credential } from './entities/credential.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Credential]),
    JwtModule.register({
      secret: 'qazwsxedcrfvtgbyhnujmikolp',
      signOptions: {expiresIn: '1d'}
    })
  ],
  controllers: [CredentialController],
  providers: [CredentialService],
})
export class CredentialModule {}
