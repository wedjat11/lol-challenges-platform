import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { configuration, RedisConfig } from '@/config';
import { dataSourceOptions } from '@/config/typeorm.config';
import { ValidationProcessor } from './validation.processor';
import { ValidatorRegistry } from './validators/validator.registry';
import { WinsAnyChampionValidator } from './validators/wins-any-champion.validator';
import { WinsWithChampionValidator } from './validators/wins-with-champion.validator';
import { AssistsAccumulatedValidator } from './validators/assists-accumulated.validator';
import { AssistsSingleGameValidator } from './validators/assists-single-game.validator';
import { KillsAccumulatedValidator } from './validators/kills-accumulated.validator';
import { KillsSingleGameValidator } from './validators/kills-single-game.validator';
import { Challenge, ChallengeValidationLog } from '@/modules/challenges/entities';
import { User, RiotAccount } from '@/modules/users/entities';
import { RiotModule } from '@/modules/riot/riot.module';
import { EconomyModule } from '@/modules/economy/economy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([Challenge, ChallengeValidationLog, User, RiotAccount]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get<RedisConfig>('redis');
        if (!redisConfig) {
          throw new Error('Redis configuration not found');
        }
        return {
          connection: {
            url: redisConfig.url,
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: 'challenge-validation',
    }),
    RiotModule,
    EconomyModule,
  ],
  providers: [
    ValidationProcessor,
    ValidatorRegistry,
    WinsAnyChampionValidator,
    WinsWithChampionValidator,
    AssistsAccumulatedValidator,
    AssistsSingleGameValidator,
    KillsAccumulatedValidator,
    KillsSingleGameValidator,
  ],
})
export class WorkerModule {}
