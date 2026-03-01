import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@/modules/users/entities';

interface RequestWithUser extends Request {
  user: User;
}

@Injectable()
export class OnboardingGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user.hasRiotAccount) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'RIOT_ACCOUNT_REQUIRED',
        message: 'You must link a Riot account to access this feature',
      });
    }

    return true;
  }
}
