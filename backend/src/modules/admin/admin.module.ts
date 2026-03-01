import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, RiotAccount } from '@/modules/users/entities';
import { ChallengeTemplate, Challenge } from '@/modules/challenges/entities';
import { CoinTransaction } from '@/modules/economy/entities';
import { EconomyModule } from '@/modules/economy/economy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RiotAccount, ChallengeTemplate, Challenge, CoinTransaction]),
    EconomyModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
