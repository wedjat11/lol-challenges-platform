import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { OnboardingGuard } from '@/modules/auth/guards/onboarding.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { User } from './entities';
import { LinkRiotAccountDto } from './dto';

interface UserProfileResponse {
  id: string;
  username: string;
  email: string;
  balance: number;
  hasRiotAccount: boolean;
  riotAccount: {
    gameName: string;
    tagLine: string;
    region: string;
    isVerified: boolean;
  } | null;
  createdAt: Date;
}

interface UserSearchResult {
  id: string;
  username: string;
  riotAccount: {
    gameName: string;
    tagLine: string;
  };
}

interface UserPublicProfile {
  id: string;
  username: string;
  hasRiotAccount: boolean;
  riotAccount: {
    gameName: string;
    tagLine: string;
  } | null;
  createdAt: Date;
}

interface RiotAccountResponse {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
  isVerified: boolean;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ========== /users/me endpoints ==========

  @Get('me')
  async getMe(@CurrentUser() user: User): Promise<UserProfileResponse> {
    const fullUser = await this.usersService.findById(user.id);
    return {
      id: fullUser.id,
      username: fullUser.username,
      email: fullUser.email,
      balance: fullUser.balance,
      hasRiotAccount: fullUser.hasRiotAccount,
      riotAccount: fullUser.riotAccount
        ? {
            gameName: fullUser.riotAccount.gameName,
            tagLine: fullUser.riotAccount.tagLine,
            region: fullUser.riotAccount.region,
            isVerified: fullUser.riotAccount.isVerified,
          }
        : null,
      createdAt: fullUser.createdAt,
    };
  }

  @Get('me/riot-account')
  async getMyRiotAccount(@CurrentUser() user: User): Promise<RiotAccountResponse> {
    const riotAccount = await this.usersService.getRiotAccount(user.id);
    return {
      puuid: riotAccount.puuid,
      gameName: riotAccount.gameName,
      tagLine: riotAccount.tagLine,
      region: riotAccount.region,
      isVerified: riotAccount.isVerified,
    };
  }

  @Post('me/riot-account')
  @HttpCode(HttpStatus.CREATED)
  async linkRiotAccount(
    @CurrentUser() user: User,
    @Body() dto: LinkRiotAccountDto,
  ): Promise<RiotAccountResponse> {
    return this.usersService.linkRiotAccount(user.id, dto);
  }

  @Patch('me/riot-account')
  @HttpCode(HttpStatus.OK)
  async updateRiotAccount(
    @CurrentUser() user: User,
    @Body() dto: LinkRiotAccountDto,
  ): Promise<RiotAccountResponse> {
    return this.usersService.updateRiotAccount(user.id, dto);
  }

  // ========== /users/search endpoint ==========

  @Get('search')
  @UseGuards(OnboardingGuard)
  async searchUsers(
    @Query('q') query: string,
    @CurrentUser() user: User,
  ): Promise<UserSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const users = await this.usersService.searchUsers(query.trim(), user.id);
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      riotAccount: {
        gameName: u.riotAccount.gameName,
        tagLine: u.riotAccount.tagLine,
      },
    }));
  }

  // ========== /users/:userId endpoint ==========

  @Get(':userId')
  @UseGuards(OnboardingGuard)
  async getUser(@Param('userId') userId: string): Promise<UserPublicProfile> {
    const user = await this.usersService.findById(userId);
    return {
      id: user.id,
      username: user.username,
      hasRiotAccount: user.hasRiotAccount,
      riotAccount: user.riotAccount
        ? {
            gameName: user.riotAccount.gameName,
            tagLine: user.riotAccount.tagLine,
          }
        : null,
      createdAt: user.createdAt,
    };
  }
}
