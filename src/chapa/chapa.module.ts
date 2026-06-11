import { Module } from '@nestjs/common';
import { ChapaController } from './chapa.controller';
import { ChapaService } from './chapa.service';

@Module({
  controllers: [ChapaController],
  providers: [ChapaService],
})
export class ChapaModule {}
