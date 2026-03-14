import { Injectable } from '@nestjs/common';
import { IValidator } from '../interfaces/validator.interface';
// Legacy validators (kept for backward compatibility with existing challenges)
import { WinsAnyChampionValidator } from './wins-any-champion.validator';
import { WinsWithChampionValidator } from './wins-with-champion.validator';
import { AssistsAccumulatedValidator } from './assists-accumulated.validator';
import { AssistsSingleGameValidator } from './assists-single-game.validator';
import { KillsAccumulatedValidator } from './kills-accumulated.validator';
import { KillsSingleGameValidator } from './kills-single-game.validator';
// Bloque: Supervivencia Extrema
import { ImmortalValidator } from './immortal.validator';
import { DeathlessStreakValidator } from './deathless-streak.validator';
import { EscapistValidator } from './escapist.validator';
import { UntouchableValidator } from './untouchable.validator';
import { LifeGuardianValidator } from './life-guardian.validator';
// Bloque: Combate y Agresividad
import { SerialKillerValidator } from './serial-killer.validator';
import { MultikillMasterValidator } from './multikill-master.validator';
import { ExplosiveDamageValidator } from './explosive-damage.validator';
import { FirstBloodKingValidator } from './first-blood-king.validator';
import { DominationValidator } from './domination.validator';
// Bloque: Macrogame y Economía
import { FarmMasterValidator } from './farm-master.validator';
import { GoldTycoonValidator } from './gold-tycoon.validator';
import { TowerDemolisherValidator } from './tower-demolisher.validator';
import { EpicHunterValidator } from './epic-hunter.validator';
import { InvaderValidator } from './invader.validator';
// Bloque: Desempeño y Utilidad
import { KillParticipationValidator } from './kill-participation.validator';
import { VisionaryValidator } from './visionary.validator';
import { WinningStreakValidator } from './winning-streak.validator';
import { EliteSupportValidator } from './elite-support.validator';
import { AbsoluteTankValidator } from './absolute-tank.validator';

@Injectable()
export class ValidatorRegistry {
  private readonly validators: Map<string, IValidator> = new Map();

  constructor(
    // Legacy
    winsAnyChampion: WinsAnyChampionValidator,
    winsWithChampion: WinsWithChampionValidator,
    assistsAccumulated: AssistsAccumulatedValidator,
    assistsSingleGame: AssistsSingleGameValidator,
    killsAccumulated: KillsAccumulatedValidator,
    killsSingleGame: KillsSingleGameValidator,
    // Supervivencia Extrema
    immortal: ImmortalValidator,
    deathlessStreak: DeathlessStreakValidator,
    escapist: EscapistValidator,
    untouchable: UntouchableValidator,
    lifeGuardian: LifeGuardianValidator,
    // Combate y Agresividad
    serialKiller: SerialKillerValidator,
    multikillMaster: MultikillMasterValidator,
    explosiveDamage: ExplosiveDamageValidator,
    firstBloodKing: FirstBloodKingValidator,
    domination: DominationValidator,
    // Macrogame y Economía
    farmMaster: FarmMasterValidator,
    goldTycoon: GoldTycoonValidator,
    towerDemolisher: TowerDemolisherValidator,
    epicHunter: EpicHunterValidator,
    invader: InvaderValidator,
    // Desempeño y Utilidad
    killParticipation: KillParticipationValidator,
    visionary: VisionaryValidator,
    winningStreak: WinningStreakValidator,
    eliteSupport: EliteSupportValidator,
    absoluteTank: AbsoluteTankValidator,
  ) {
    // Legacy
    this.register(winsAnyChampion);
    this.register(winsWithChampion);
    this.register(assistsAccumulated);
    this.register(assistsSingleGame);
    this.register(killsAccumulated);
    this.register(killsSingleGame);
    // Supervivencia Extrema
    this.register(immortal);
    this.register(deathlessStreak);
    this.register(escapist);
    this.register(untouchable);
    this.register(lifeGuardian);
    // Combate y Agresividad
    this.register(serialKiller);
    this.register(multikillMaster);
    this.register(explosiveDamage);
    this.register(firstBloodKing);
    this.register(domination);
    // Macrogame y Economía
    this.register(farmMaster);
    this.register(goldTycoon);
    this.register(towerDemolisher);
    this.register(epicHunter);
    this.register(invader);
    // Desempeño y Utilidad
    this.register(killParticipation);
    this.register(visionary);
    this.register(winningStreak);
    this.register(eliteSupport);
    this.register(absoluteTank);
  }

  private register(validator: IValidator): void {
    this.validators.set(validator.validatorKey, validator);
  }

  get(key: string): IValidator | undefined {
    return this.validators.get(key);
  }

  getAll(): IValidator[] {
    return Array.from(this.validators.values());
  }
}
