import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { configuration, RedisConfig } from './config';
import { dataSourceOptions } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EconomyModule } from './modules/economy/economy.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { RiotModule } from './modules/riot/riot.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRoot(dataSourceOptions),

    // Queue (BullMQ)
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

    // Feature modules
    AuthModule,
    UsersModule,
    EconomyModule,
    ChallengesModule,
    RiotModule,
    HealthModule,
    AdminModule,
  ],
})
export class AppModule {}
