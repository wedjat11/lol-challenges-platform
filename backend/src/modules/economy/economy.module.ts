import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CoinTransaction } from './entities';
import { User } from '@/modules/users/entities';
import { EconomyService } from './economy.service';
import { EconomyController } from './economy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CoinTransaction, User]), ConfigModule],
  controllers: [EconomyController],
  providers: [EconomyService],
  exports: [EconomyService],
})
export class EconomyModule {}
