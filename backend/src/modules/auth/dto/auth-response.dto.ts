export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
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
  };
}
