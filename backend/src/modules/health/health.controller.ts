import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { RedisConfig } from '@/config';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async check(): Promise<{
    status: string;
    timestamp: string;
    services: {
      database: string;
      redis: string;
    };
  }> {
    let databaseStatus = 'healthy';
    let redisStatus = 'healthy';

    // Check database
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      databaseStatus = 'unhealthy';
    }

    // Check Redis
    try {
      const redisConfig = this.configService.get<RedisConfig>('redis');
      const redis = new Redis(redisConfig?.url ?? 'redis://localhost:6379', {
        connectTimeout: 3000,
        maxRetriesPerRequest: 1,
      });

      const pong = await redis.ping();
      if (pong !== 'PONG') {
        redisStatus = 'unhealthy';
      }
      await redis.quit();
    } catch {
      redisStatus = 'unhealthy';
    }

    const allHealthy = databaseStatus === 'healthy' && redisStatus === 'healthy';

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: databaseStatus,
        redis: redisStatus,
      },
    };
  }
}
