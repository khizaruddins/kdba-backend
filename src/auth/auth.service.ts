import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { JwtPayload } from '../common/decorators';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Generate tenant slug from business name
    const tenantSlug = this.generateSlug(dto.businessName);
    const uniqueSlug = await this.ensureUniqueSlug(tenantSlug);

    // Create user, tenant, and membership in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.businessName,
          slug: uniqueSlug,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });

      // Create tenant membership with OWNER role
      await tx.tenantMember.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'OWNER',
        },
      });

      return { user, tenant };
    });

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      role: 'OWNER',
    });

    return {
      user: this.sanitizeUser(result.user),
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        memberships: {
          include: { tenant: true },
          take: 1,
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException('No tenant associated with this account');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      tenantId: membership.tenantId,
      role: membership.role,
    });

    return {
      user: this.sanitizeUser(user),
      tenant: {
        id: membership.tenant.id,
        name: membership.tenant.name,
        slug: membership.tenant.slug,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const tokens = await this.generateTokens({
      sub: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async getProfile(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const currentMembership = user.memberships.find(
      (m) => m.tenantId === payload.tenantId,
    );

    return {
      user: this.sanitizeUser(user),
      tenant: currentMembership
        ? {
            id: currentMembership.tenant.id,
            name: currentMembership.tenant.name,
            slug: currentMembership.tenant.slug,
          }
        : null,
      role: currentMembership?.role || null,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // In V1, log the token to console. In production, send via email.
    console.log(`[Password Reset] Token for ${user.email}: ${resetToken}`);

    return { message: 'If an account exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password has been reset successfully' };
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private async generateTokens(payload: JwtPayload) {
    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'kdba-access-secret-change-in-production';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'kdba-refresh-secret-change-in-production';
    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as any, {
        secret: accessSecret,
        expiresIn: accessExpiresIn as any,
      }),
      this.jwtService.signAsync(payload as any, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: { id: string; email: string; firstName: string; lastName: string; avatarUrl: string | null; createdAt: Date }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60);
  }

  private async ensureUniqueSlug(slug: string): Promise<string> {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!existing) return slug;

    // Append random suffix
    const suffix = crypto.randomBytes(3).toString('hex');
    return `${slug}-${suffix}`;
  }
}
