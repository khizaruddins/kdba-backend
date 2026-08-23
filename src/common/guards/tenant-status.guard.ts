import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../decorators';

@Injectable()
export class TenantStatusGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user || user.isSuperAdmin) {
      return true;
    }

    if (!user.tenantId) {
      return true;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { status: true, blockedReason: true },
    });

    if (!tenant) {
      return true;
    }

    if (tenant.status === 'BLOCKED') {
      throw new ForbiddenException(
        `This organization has been blocked by platform administration. Reason: ${
          tenant.blockedReason || 'Terms of Service or payment compliance'
        }. Please contact support@kdba.agency for assistance.`,
      );
    }

    if (tenant.status === 'SUSPENDED') {
      throw new ForbiddenException(
        `This organization is temporarily suspended. Reason: ${
          tenant.blockedReason || 'Subscription renewal required'
        }.`,
      );
    }

    return true;
  }
}
