import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { AppConfig } from '@/config';

const COOKIE_NAME = 'lol_refresh';

interface UserResponse {
  id: string;
  username: string;
  email: string;
  balance: number;
  hasRiotAccount: boolean;
  riotAccount?: {
    gameName: string;
    tagLine: string;
    region: string;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; user: UserResponse }> {
    const result = await this.authService.register(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; user: UserResponse }> {
    const result = await this.authService.login(dto);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies?.[COOKIE_NAME] as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'MISSING_REFRESH_TOKEN',
        message: 'Refresh token not found',
      });
    }

    const result = await this.authService.refreshToken(refreshToken);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
    };
  }

  @Post('clerk-sync')
  @HttpCode(HttpStatus.OK)
  async clerkSync(
    @Body() body: { clerkToken: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; user: UserResponse; isNewUser: boolean }> {
    const result = await this.authService.clerkSync(body.clerkToken);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
      isNewUser: result.isNewUser,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    const appConfig = this.configService.get<AppConfig>('app');
    const isProduction = appConfig?.nodeEnv === 'production';

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
    });
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const appConfig = this.configService.get<AppConfig>('app');
    const isProduction = appConfig?.nodeEnv === 'production';

    res.cookie(COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
