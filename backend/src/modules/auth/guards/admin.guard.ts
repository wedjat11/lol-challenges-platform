import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@/modules/users/entities';
import { UserRole } from '@/common/enums';

interface RequestWithUser extends Request {
  user: User;
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ADMIN_REQUIRED',
        message: 'Admin access required',
      });
    }

    return true;
  }
}
