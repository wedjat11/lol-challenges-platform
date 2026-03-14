import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RiotConfig } from '@/config';

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotMatch {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameId: number;
    gameStartTimestamp: number;
    gameDuration: number;
    gameMode: string;
    queueId: number;
    participants: Array<{
      puuid: string;
      championId: number;
      championName: string;
      teamId: number;
      kills: number;
      deaths: number;
      assists: number;
      win: boolean;
      // Combat
      totalDamageDealtToChampions: number;
      damageSelfMitigated: number;
      firstBloodKill: boolean;
      doubleKills: number;
      tripleKills: number;
      quadraKills: number;
      pentaKills: number;
      // Economy & macro
      goldEarned: number;
      totalMinionsKilled: number;
      neutralMinionsKilled: number;
      turretKills: number;
      // Utility
      visionScore: number;
      // Advanced stats (Match V5 challenges object — optional)
      challenges?: {
        turretTakedowns?: number;
        dragonTakedowns?: number;
        baronTakedowns?: number;
        riftHeraldTakedowns?: number;
        enemyJungleMonsterKills?: number;
        killParticipation?: number;
      };
    }>;
  };
}

@Injectable()
export class RiotService {
  private readonly config: RiotConfig;

  constructor(private readonly configService: ConfigService) {
    const riotConfig = this.configService.get<RiotConfig>('riot');
    if (!riotConfig) {
      throw new Error('Riot configuration not found');
    }
    this.config = riotConfig;
  }

  async getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount> {
    const url = `${this.config.regionalUrl}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

    const response = await this.makeRequest<RiotAccount>(url);
    return response;
  }

  async getSummonerByPuuid(puuid: string): Promise<{ profileIconId: number; summonerLevel: number }> {
    const url = `${this.config.baseUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const data = await this.makeRequest<{ profileIconId: number; summonerLevel: number }>(url);
    return { profileIconId: data.profileIconId, summonerLevel: data.summonerLevel };
  }

  async getMatchIds(puuid: string, count = 20, queue?: number): Promise<string[]> {
    let url = `${this.config.regionalUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;

    if (queue) {
      url += `&queue=${queue}`;
    }

    return this.makeRequest<string[]>(url);
  }

  async getMatch(matchId: string): Promise<RiotMatch> {
    const url = `${this.config.regionalUrl}/lol/match/v5/matches/${matchId}`;
    return this.makeRequest<RiotMatch>(url);
  }

  private async makeRequest<T>(url: string, retries = 0): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': this.config.apiKey,
        },
      });

      if (response.status === 429) {
        // Rate limited - retry with backoff
        if (retries < this.config.maxRetries) {
          const delay = this.config.retryBaseDelayMs * Math.pow(2, retries);
          await this.sleep(delay);
          return this.makeRequest<T>(url, retries + 1);
        }
        throw new BadRequestException({
          statusCode: 429,
          code: 'RIOT_RATE_LIMITED',
          message: 'Riot API rate limit exceeded',
        });
      }

      if (response.status === 403) {
        throw new BadRequestException({
          statusCode: 403,
          code: 'RIOT_API_KEY_INVALID',
          message: 'Riot API key is invalid or expired',
        });
      }

      if (response.status === 404) {
        throw new BadRequestException({
          statusCode: 404,
          code: 'RIOT_NOT_FOUND',
          message: 'Riot account or resource not found',
        });
      }

      if (!response.ok) {
        throw new BadRequestException({
          statusCode: response.status,
          code: 'RIOT_API_ERROR',
          message: `Riot API error: ${response.statusText}`,
        });
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (retries < this.config.maxRetries) {
        const delay = this.config.retryBaseDelayMs * Math.pow(2, retries);
        await this.sleep(delay);
        return this.makeRequest<T>(url, retries + 1);
      }

      throw new BadRequestException({
        statusCode: 500,
        code: 'RIOT_API_UNAVAILABLE',
        message: 'Unable to reach Riot API',
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
