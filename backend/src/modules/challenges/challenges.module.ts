import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Challenge, ChallengeTemplate, ChallengeValidationLog } from './entities';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { TemplatesController } from './templates.controller';
import { EconomyModule } from '@/modules/economy/economy.module';
import { RedisConfig } from '@/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge, ChallengeTemplate, ChallengeValidationLog]),
    BullModule.registerQueueAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: 'challenge-validation',
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get<RedisConfig>('redis');
        return {
          connection: {
            url: redisConfig?.url ?? 'redis://localhost:6379',
          },
        };
      },
    }),
    EconomyModule,
    ConfigModule,
  ],
  controllers: [ChallengesController, TemplatesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
