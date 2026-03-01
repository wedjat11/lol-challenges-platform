import { Injectable } from '@nestjs/common';
import { IValidator } from '../interfaces/validator.interface';
import { WinsAnyChampionValidator } from './wins-any-champion.validator';
import { WinsWithChampionValidator } from './wins-with-champion.validator';
import { AssistsAccumulatedValidator } from './assists-accumulated.validator';
import { AssistsSingleGameValidator } from './assists-single-game.validator';
import { KillsAccumulatedValidator } from './kills-accumulated.validator';
import { KillsSingleGameValidator } from './kills-single-game.validator';

@Injectable()
export class ValidatorRegistry {
  private readonly validators: Map<string, IValidator> = new Map();

  constructor(
    winsAnyChampion: WinsAnyChampionValidator,
    winsWithChampion: WinsWithChampionValidator,
    assistsAccumulated: AssistsAccumulatedValidator,
    assistsSingleGame: AssistsSingleGameValidator,
    killsAccumulated: KillsAccumulatedValidator,
    killsSingleGame: KillsSingleGameValidator,
  ) {
    this.register(winsAnyChampion);
    this.register(winsWithChampion);
    this.register(assistsAccumulated);
    this.register(assistsSingleGame);
    this.register(killsAccumulated);
    this.register(killsSingleGame);
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
