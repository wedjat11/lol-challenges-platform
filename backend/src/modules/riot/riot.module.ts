import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RiotService } from './riot.service';

@Module({
  imports: [ConfigModule],
  providers: [RiotService],
  exports: [RiotService],
})
export class RiotModule {}
