import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, RiotAccount } from '@/modules/users/entities';
import { AuthProvider } from '@/common/enums';
import { AuthConfig } from '@/config';
import { EconomyService } from '@/modules/economy/economy.service';
import { RiotService } from '@/modules/riot/riot.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RiotAccount)
    private readonly riotAccountRepository: Repository<RiotAccount>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly economyService: EconomyService,
    private readonly riotService: RiotService,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check for existing user
    const existingUser = await this.userRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException({
          statusCode: 409,
          code: 'EMAIL_EXISTS',
          message: 'Email already registered',
        });
      }
      throw new ConflictException({
        statusCode: 409,
        code: 'USERNAME_EXISTS',
        message: 'Username already taken',
      });
    }

    // Verify Riot account if provided
    let riotAccountData: { puuid: string; gameName: string; tagLine: string } | null = null;

    if (dto.gameName && dto.tagLine) {
      // Check if Riot account is already linked to another user
      try {
        const riotAccount = await this.riotService.getAccountByRiotId(dto.gameName, dto.tagLine);

        const existingRiotAccount = await this.riotAccountRepository.findOne({
          where: { puuid: riotAccount.puuid },
        });

        if (existingRiotAccount) {
          throw new ConflictException({
            statusCode: 409,
            code: 'RIOT_ACCOUNT_LINKED',
            message: 'This Riot account is already linked to another user',
          });
        }

        riotAccountData = riotAccount;
      } catch (error) {
        if (error instanceof ConflictException) {
          throw error;
        }
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException({
          statusCode: 400,
          code: 'RIOT_VERIFICATION_FAILED',
          message: 'Failed to verify Riot account',
        });
      }
    }

    const authConfig = this.configService.get<AuthConfig>('auth');
    if (!authConfig) {
      throw new Error('Auth configuration not found');
    }

    const passwordHash = await bcrypt.hash(dto.password, authConfig.bcryptRounds);

    // Create user and optionally link Riot account in a transaction
    const user = await this.dataSource.transaction(async (manager) => {
      const newUser = manager.getRepository(User).create({
        username: dto.username,
        email: dto.email,
        passwordHash,
        authProvider: AuthProvider.EMAIL,
        hasRiotAccount: riotAccountData !== null,
      });

      const savedUser = await manager.getRepository(User).save(newUser);

      // Link Riot account if verified
      if (riotAccountData) {
        const riotAccount = manager.getRepository(RiotAccount).create({
          userId: savedUser.id,
          puuid: riotAccountData.puuid,
          gameName: riotAccountData.gameName,
          tagLine: riotAccountData.tagLine,
          region: 'LA1',
          isVerified: true,
          verifiedAt: new Date(),
        });

        await manager.getRepository(RiotAccount).save(riotAccount);
      }

      return savedUser;
    });

    // Grant signup bonus (atomic transaction via EconomyService)
    await this.economyService.grantSignupBonus(user.id);

    // Reload user to get updated balance
    const updatedUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['riotAccount'],
    });

    if (!updatedUser) {
      throw new Error('User not found after creation');
    }

    return this.generateTokens(updatedUser);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      relations: ['riotAccount'],
    });

    // Same error for email not found and wrong password (anti-enumeration)
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    const authConfig = this.configService.get<AuthConfig>('auth');
    if (!authConfig) {
      throw new Error('Auth configuration not found');
    }

    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: authConfig.refreshTokenSecret,
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['riotAccount'],
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException({
          statusCode: 401,
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
        });
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
    }
  }

  async clerkSync(clerkToken: string): Promise<AuthResponseDto & { isNewUser: boolean }> {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) {
      throw new InternalServerErrorException({
        code: 'CLERK_NOT_CONFIGURED',
        message: 'CLERK_SECRET_KEY is not configured on the server',
      });
    }

    // Dynamic import to avoid issues if the package is not installed
    const { verifyToken, createClerkClient } = await import('@clerk/backend');

    let clerkUserId: string;
    let email: string;

    try {
      const claims = await verifyToken(clerkToken, { secretKey });
      clerkUserId = claims.sub;

      const clerkClient = createClerkClient({ secretKey });
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
    } catch {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_CLERK_TOKEN',
        message: 'Could not verify Clerk session',
      });
    }

    if (!email) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'NO_EMAIL',
        message: 'Clerk user has no primary email address',
      });
    }

    // Find existing user by Clerk ID or email (for migrating existing accounts)
    let user = await this.userRepository.findOne({
      where: [{ clerkUserId }, { email }],
      relations: ['riotAccount'],
    });

    let isNewUser = false;

    if (!user) {
      // First time — create DB user and send to onboarding
      isNewUser = true;
      const baseUsername = email.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '_') ?? 'user';
      const username = `${baseUsername}_${Date.now().toString().slice(-6)}`;

      const newUser = this.userRepository.create({
        username,
        email,
        clerkUserId,
        authProvider: AuthProvider.EMAIL,
        passwordHash: null,
        hasRiotAccount: false,
      });

      const savedUser = await this.userRepository.save(newUser);
      await this.economyService.grantSignupBonus(savedUser.id);

      user = await this.userRepository.findOne({
        where: { id: savedUser.id },
        relations: ['riotAccount'],
      });

      if (!user) {
        throw new Error('User not found after creation');
      }
    } else if (!user.clerkUserId) {
      // Existing email-based account: link it to Clerk
      await this.userRepository.update(user.id, { clerkUserId });
      user.clerkUserId = clerkUserId;
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive',
      });
    }

    return { ...this.generateTokens(user), isNewUser };
  }

  private generateTokens(user: User): AuthResponseDto {
    const authConfig = this.configService.get<AuthConfig>('auth');
    if (!authConfig) {
      throw new Error('Auth configuration not found');
    }

    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: authConfig.refreshTokenSecret,
      expiresIn: authConfig.refreshTokenExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        hasRiotAccount: user.hasRiotAccount,
        riotAccount: user.riotAccount
          ? {
              gameName: user.riotAccount.gameName,
              tagLine: user.riotAccount.tagLine,
              region: user.riotAccount.region,
            }
          : undefined,
      },
    };
  }
}
