import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User, RiotAccount } from '@/modules/users/entities';
import { AuthConfig } from '@/config';
import { EconomyModule } from '@/modules/economy/economy.module';
import { RiotModule } from '@/modules/riot/riot.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const authConfig = configService.get<AuthConfig>('auth');
        if (!authConfig) {
          throw new Error('Auth configuration not found');
        }
        return {
          secret: authConfig.jwtSecret,
          signOptions: { expiresIn: authConfig.jwtExpiresIn },
        };
      },
    }),
    TypeOrmModule.forFeature([User, RiotAccount]),
    EconomyModule,
    RiotModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
