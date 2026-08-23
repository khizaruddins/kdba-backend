import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload } from '../decorators';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.isSuperAdmin === true || user.role === 'SUPER_ADMIN') {
      return true;
    }

    throw new ForbiddenException('Super Admin privileges required to access this resource');
  }
}
