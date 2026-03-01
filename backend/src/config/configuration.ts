export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  frontendUrl: string;
  logLevel: string;
}

export interface DatabaseConfig {
  url: string;
  poolMin: number;
  poolMax: number;
  ssl: boolean;
}

export interface RedisConfig {
  url: string;
  queueName: string;
  cacheTtlMatch: number;
  cacheTtlMatchlist: number;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: string;
  cookieSecret: string;
  bcryptRounds: number;
  corsOrigin: string;
}

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface RiotConfig {
  apiKey: string;
  baseUrl: string;
  regionalUrl: string;
  rateLimitPerSecond: number;
  rateLimitPer2Min: number;
  maxRetries: number;
  retryBaseDelayMs: number;
}

export interface EconomyConfig {
  signupBonusCoins: number;
  challengeCreationCost: number;
  validationCooldownMinutes: number;
}

export interface WorkerConfig {
  concurrency: number;
  jobMaxRetries: number;
  jobBackoffDelayMs: number;
  jobRetentionCompleted: number;
  jobRetentionFailed: number;
}

export interface Configuration {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  auth: AuthConfig;
  google: GoogleConfig;
  riot: RiotConfig;
  economy: EconomyConfig;
  worker: WorkerConfig;
}

export default (): Configuration => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    apiPrefix: process.env.API_PREFIX || 'v1',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || 'debug',
  },
  database: {
    url: process.env.DATABASE_URL || '',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    ssl: process.env.DB_SSL === 'true',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    queueName: process.env.REDIS_QUEUE_NAME || 'challenge-validation',
    cacheTtlMatch: parseInt(process.env.REDIS_CACHE_TTL_MATCH || '86400', 10),
    cacheTtlMatchlist: parseInt(process.env.REDIS_CACHE_TTL_MATCHLIST || '90', 10),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || '',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    cookieSecret: process.env.COOKIE_SECRET || '',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
  },
  riot: {
    apiKey: process.env.RIOT_API_KEY || '',
    baseUrl: process.env.RIOT_API_BASE_URL || 'https://la1.api.riotgames.com',
    regionalUrl: process.env.RIOT_API_REGIONAL_URL || 'https://americas.api.riotgames.com',
    rateLimitPerSecond: parseInt(process.env.RIOT_RATE_LIMIT_PER_SECOND || '18', 10),
    rateLimitPer2Min: parseInt(process.env.RIOT_RATE_LIMIT_PER_2MIN || '90', 10),
    maxRetries: parseInt(process.env.RIOT_MAX_RETRIES || '3', 10),
    retryBaseDelayMs: parseInt(process.env.RIOT_RETRY_BASE_DELAY_MS || '5000', 10),
  },
  economy: {
    signupBonusCoins: parseInt(process.env.SIGNUP_BONUS_COINS || '10', 10),
    challengeCreationCost: parseInt(process.env.CHALLENGE_CREATION_COST || '1', 10),
    validationCooldownMinutes: parseInt(process.env.VALIDATION_COOLDOWN_MINUTES || '10', 10),
  },
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2', 10),
    jobMaxRetries: parseInt(process.env.JOB_MAX_RETRIES || '3', 10),
    jobBackoffDelayMs: parseInt(process.env.JOB_BACKOFF_DELAY_MS || '5000', 10),
    jobRetentionCompleted: parseInt(process.env.JOB_RETENTION_COMPLETED || '24', 10),
    jobRetentionFailed: parseInt(process.env.JOB_RETENTION_FAILED || '168', 10),
  },
});
