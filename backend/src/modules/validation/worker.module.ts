import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { configuration, RedisConfig } from '@/config';
import { dataSourceOptions } from '@/config/typeorm.config';
import { ValidationProcessor } from './validation.processor';
import { ValidatorRegistry } from './validators/validator.registry';
// Legacy validators
import { WinsAnyChampionValidator } from './validators/wins-any-champion.validator';
import { WinsWithChampionValidator } from './validators/wins-with-champion.validator';
import { AssistsAccumulatedValidator } from './validators/assists-accumulated.validator';
import { AssistsSingleGameValidator } from './validators/assists-single-game.validator';
import { KillsAccumulatedValidator } from './validators/kills-accumulated.validator';
import { KillsSingleGameValidator } from './validators/kills-single-game.validator';
// Bloque: Supervivencia Extrema
import { ImmortalValidator } from './validators/immortal.validator';
import { DeathlessStreakValidator } from './validators/deathless-streak.validator';
import { EscapistValidator } from './validators/escapist.validator';
import { UntouchableValidator } from './validators/untouchable.validator';
import { LifeGuardianValidator } from './validators/life-guardian.validator';
// Bloque: Combate y Agresividad
import { SerialKillerValidator } from './validators/serial-killer.validator';
import { MultikillMasterValidator } from './validators/multikill-master.validator';
import { ExplosiveDamageValidator } from './validators/explosive-damage.validator';
import { FirstBloodKingValidator } from './validators/first-blood-king.validator';
import { DominationValidator } from './validators/domination.validator';
// Bloque: Macrogame y Economía
import { FarmMasterValidator } from './validators/farm-master.validator';
import { GoldTycoonValidator } from './validators/gold-tycoon.validator';
import { TowerDemolisherValidator } from './validators/tower-demolisher.validator';
import { EpicHunterValidator } from './validators/epic-hunter.validator';
import { InvaderValidator } from './validators/invader.validator';
// Bloque: Desempeño y Utilidad
import { KillParticipationValidator } from './validators/kill-participation.validator';
import { VisionaryValidator } from './validators/visionary.validator';
import { WinningStreakValidator } from './validators/winning-streak.validator';
import { EliteSupportValidator } from './validators/elite-support.validator';
import { AbsoluteTankValidator } from './validators/absolute-tank.validator';
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
    // Legacy
    WinsAnyChampionValidator,
    WinsWithChampionValidator,
    AssistsAccumulatedValidator,
    AssistsSingleGameValidator,
    KillsAccumulatedValidator,
    KillsSingleGameValidator,
    // Supervivencia Extrema
    ImmortalValidator,
    DeathlessStreakValidator,
    EscapistValidator,
    UntouchableValidator,
    LifeGuardianValidator,
    // Combate y Agresividad
    SerialKillerValidator,
    MultikillMasterValidator,
    ExplosiveDamageValidator,
    FirstBloodKingValidator,
    DominationValidator,
    // Macrogame y Economía
    FarmMasterValidator,
    GoldTycoonValidator,
    TowerDemolisherValidator,
    EpicHunterValidator,
    InvaderValidator,
    // Desempeño y Utilidad
    KillParticipationValidator,
    VisionaryValidator,
    WinningStreakValidator,
    EliteSupportValidator,
    AbsoluteTankValidator,
  ],
})
export class WorkerModule {}
