
import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Profile } from './entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile]),
    JwtModule.register({
      secret: 'qazwsxedcrfvtgbyhnujmikolp',
      signOptions: {expiresIn: '1d'}
    })
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}