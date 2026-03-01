import { AuthProvider, UserRole } from '@/common/enums';

export class AdminUserResponseDto {
  id: string;
  username: string;
  email: string;
  balance: number;
  hasRiotAccount: boolean;
  isActive: boolean;
  role: UserRole;
  authProvider: AuthProvider;
  createdAt: Date;
  riotAccount?: {
    puuid: string;
    gameName: string;
    tagLine: string;
    region: string;
    isVerified: boolean;
  } | null;
}
