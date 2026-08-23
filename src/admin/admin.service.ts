import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AdminRegisterDto, AdminLoginDto } from './dto/admin-auth.dto';
import {
  UpdateTenantStatusDto,
  CreateInvoiceDto,
  UpdateSubscriptionDto,
  CreatePlanDto,
} from './dto/admin-governance.dto';
import {
  TenantStatus,
  InvoiceStatus,
  SubscriptionStatus,
} from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── SUPER ADMIN AUTH ────────────────────────────────────────────────────────

  async registerAdmin(dto: AdminRegisterDto) {
    const configuredSecret =
      this.configService.get<string>('SUPER_ADMIN_SECRET') ||
      'KDBA_SUPER_ADMIN_MASTER_KEY_2026';

    if (dto.adminSecretKey !== configuredSecret) {
      throw new ForbiddenException('Invalid Super Admin Secret Key');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      if (existing.isSuperAdmin) {
        throw new ConflictException(
          'Super admin with this email already exists',
        );
      }
      // Upgrade existing user
      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: { isSuperAdmin: true },
      });
      return this.buildAdminAuthResponse(updated);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        isSuperAdmin: true,
        emailVerified: true,
      },
    });

    return this.buildAdminAuthResponse(user);
  }

  async loginAdmin(dto: AdminLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.isSuperAdmin || !user.isActive) {
      throw new UnauthorizedException(
        'Invalid admin credentials or unauthorized account',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    return this.buildAdminAuthResponse(user);
  }

  async getAdminProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isSuperAdmin) {
      throw new UnauthorizedException('Super admin profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isSuperAdmin: true,
      role: 'SUPER_ADMIN',
    };
  }

  private async buildAdminAuthResponse(user: any) {
    const tokens = await this.generateAdminTokens(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isSuperAdmin: true,
        role: 'SUPER_ADMIN',
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async generateAdminTokens(user: any) {
    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'kdba-access-secret-change-in-production';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'kdba-refresh-secret-change-in-production';

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: 'platform',
      role: 'SUPER_ADMIN',
      isSuperAdmin: true,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '24h',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '30d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // ─── PLATFORM OVERVIEW & FINANCIAL ANALYTICS ──────────────────────────────────

  async getOverview() {
    const [
      totalTenants,
      activeTenants,
      blockedTenants,
      suspendedTenants,
      totalLiveWebsites,
      allSubscriptions,
      allInvoices,
      allTransactions,
      plans,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.tenant.count({ where: { status: 'BLOCKED' } }),
      this.prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.website.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.tenantSubscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true },
      }),
      this.prisma.invoice.findMany(),
      this.prisma.paymentTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.platformPlan.findMany(),
    ]);

    // Calculate Total Gross Revenue from successful payments
    const successfulTxns = await this.prisma.paymentTransaction.findMany({
      where: { status: 'SUCCESS' },
      select: { amount: true },
    });
    const totalGrossRevenue = successfulTxns.reduce(
      (acc, curr) => acc + Number(curr.amount),
      0,
    );

    // Calculate Monthly Recurring Revenue (MRR)
    let mrr = 0;
    for (const sub of allSubscriptions) {
      const amount = Number(sub.amount);
      if (sub.billingCycle === 'YEARLY') {
        mrr += amount / 12;
      } else {
        mrr += amount;
      }
    }
    const arr = mrr * 12;

    // Calculate Invoices Summary
    let totalInvoicesAmount = 0;
    let paidInvoicesAmount = 0;
    let pendingInvoicesAmount = 0;
    let overdueInvoicesAmount = 0;

    for (const inv of allInvoices) {
      const amt = Number(inv.amount);
      totalInvoicesAmount += amt;
      if (inv.status === 'PAID') paidInvoicesAmount += amt;
      else if (inv.status === 'PENDING') pendingInvoicesAmount += amt;
      else if (inv.status === 'OVERDUE') overdueInvoicesAmount += amt;
    }

    // Plan breakdown
    const planDistribution = plans.map((plan) => {
      const count = allSubscriptions.filter((s) => s.planId === plan.id).length;
      return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        monthlyPrice: Number(plan.monthlyPrice),
        activeSubscribers: count,
        mrrContribution: count * Number(plan.monthlyPrice),
      };
    });

    // 12-Month Revenue Breakdown
    const monthlyTrendMap: Record<
      string,
      { month: string; revenue: number; transactions: number }
    > = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
      monthlyTrendMap[key] = { month: key, revenue: 0, transactions: 0 };
    }

    const allSuccessfulTxns = await this.prisma.paymentTransaction.findMany({
      where: { status: 'SUCCESS' },
      select: { amount: true, createdAt: true },
    });

    for (const tx of allSuccessfulTxns) {
      const key = `${tx.createdAt.toLocaleString('default', { month: 'short' })} ${tx.createdAt.getFullYear()}`;
      if (monthlyTrendMap[key]) {
        monthlyTrendMap[key].revenue += Number(tx.amount);
        monthlyTrendMap[key].transactions += 1;
      }
    }

    return {
      financials: {
        totalGrossRevenue,
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        totalInvoicesAmount,
        paidInvoicesAmount,
        pendingInvoicesAmount,
        overdueInvoicesAmount,
      },
      tenants: {
        total: totalTenants,
        active: activeTenants,
        blocked: blockedTenants,
        suspended: suspendedTenants,
      },
      websites: {
        totalLive: totalLiveWebsites,
      },
      planDistribution,
      revenueTrend: Object.values(monthlyTrendMap),
      recentTransactions: allTransactions.map((tx) => ({
        id: tx.id,
        transactionNumber: tx.transactionNumber,
        tenantName: tx.tenant?.name || 'Unknown Organization',
        tenantSlug: tx.tenant?.slug || '',
        amount: Number(tx.amount),
        currency: tx.currency,
        status: tx.status,
        gateway: tx.gateway,
        paymentMethod: tx.paymentMethod,
        createdAt: tx.createdAt,
      })),
    };
  }

  // ─── TENANTS GOVERNANCE ───────────────────────────────────────────────────────

  async getTenants(query?: {
    search?: string;
    status?: TenantStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(Number(query?.page) || 1, 1);
    const limit = Math.min(Number(query?.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.status) {
      where.status = query.status;
    }
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        {
          members: {
            some: {
              user: { email: { contains: query.search, mode: 'insensitive' } },
            },
          },
        },
      ];
    }

    const [total, tenants] = await Promise.all([
      this.prisma.tenant.count({ where }),
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          members: {
            where: { role: 'OWNER' },
            include: {
              user: {
                select: { email: true, firstName: true, lastName: true },
              },
            },
            take: 1,
          },
          subscriptions: {
            where: { status: { in: ['ACTIVE', 'TRIALING'] } },
            include: { plan: true },
            take: 1,
          },
          websites: {
            select: { id: true, name: true, slug: true, status: true },
          },
          businesses: { select: { id: true, name: true } },
          payments: {
            where: { status: 'SUCCESS' },
            select: { amount: true },
          },
        },
      }),
    ]);

    const items = tenants.map((t) => {
      const owner = t.members[0]?.user;
      const sub = t.subscriptions[0];
      const totalPaid = t.payments.reduce(
        (acc, p) => acc + Number(p.amount),
        0,
      );

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        blockedReason: t.blockedReason,
        blockedAt: t.blockedAt,
        createdAt: t.createdAt,
        owner: owner
          ? {
              name: `${owner.firstName} ${owner.lastName}`,
              email: owner.email,
            }
          : null,
        plan: sub
          ? {
              name:
                sub.status === 'TRIALING'
                  ? `${sub.plan.name} (30-Day Free Trial)`
                  : sub.plan.name,
              amount: Number(sub.amount),
              billingCycle: sub.billingCycle,
              status: sub.status,
            }
          : { name: 'Free / Unassigned', amount: 0, status: 'NONE' },
        websitesCount: t.websites.length,
        liveWebsitesCount: t.websites.filter((w) => w.status === 'PUBLISHED')
          .length,
        businessesCount: t.businesses.length,
        totalRevenueContributed: totalPaid,
      };
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTenantDetails(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                isActive: true,
                createdAt: true,
              },
            },
          },
        },
        businesses: true,
        websites: {
          include: {
            pages: { select: { id: true, title: true, slug: true } },
          },
        },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant organization not found');
    }

    return tenant;
  }

  async updateTenantStatus(id: string, dto: UpdateTenantStatusDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const isBlocking = dto.status === 'BLOCKED' || dto.status === 'SUSPENDED';

    return this.prisma.tenant.update({
      where: { id },
      data: {
        status: dto.status,
        blockedReason: isBlocking
          ? dto.reason || 'Administrative action'
          : null,
        blockedAt: isBlocking ? new Date() : null,
      },
    });
  }

  // ─── SUBSCRIPTION & BILLING MANAGEMENT ────────────────────────────────────────

  async getSubscriptions() {
    const subs = await this.prisma.tenantSubscription.findMany({
      include: {
        tenant: { select: { id: true, name: true, slug: true, status: true } },
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return subs.map((s) => ({
      ...s,
      amount: Number(s.amount),
      plan: {
        ...s.plan,
        monthlyPrice: Number(s.plan.monthlyPrice),
        yearlyPrice: Number(s.plan.yearlyPrice),
      },
    }));
  }

  async updateSubscription(id: string, dto: UpdateSubscriptionDto) {
    const sub = await this.prisma.tenantSubscription.findUnique({
      where: { id },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    return this.prisma.tenantSubscription.update({
      where: { id },
      data: {
        ...(dto.planId && { planId: dto.planId }),
        ...(dto.status && { status: dto.status }),
        ...(dto.billingCycle && { billingCycle: dto.billingCycle }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.currentPeriodEnd && {
          currentPeriodEnd: new Date(dto.currentPeriodEnd),
        }),
      },
      include: { plan: true, tenant: true },
    });
  }

  async getInvoices(query?: { status?: InvoiceStatus; tenantId?: string }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.tenantId) where.tenantId = query.tenantId;

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((inv) => ({
      ...inv,
      amount: Number(inv.amount),
    }));
  }

  async createInvoice(dto: CreateInvoiceDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const invoiceCount = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(4, '0')}`;

    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        tenantId: dto.tenantId,
        subscriptionId: dto.subscriptionId || null,
        amount: dto.amount,
        currency: dto.currency || 'USD',
        status: dto.status || 'PENDING',
        dueDate,
        paymentMethod: dto.paymentMethod || 'MANUAL',
        lineItems: dto.lineItems || [
          {
            description: 'KDBA Platform Services',
            amount: dto.amount,
            quantity: 1,
          },
        ],
        notes: dto.notes || null,
      },
      include: { tenant: true },
    });

    // If marked as paid on creation, create a payment transaction
    if (dto.status === 'PAID') {
      await this.prisma.paymentTransaction.create({
        data: {
          transactionNumber: `TXN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
          tenantId: dto.tenantId,
          invoiceId: invoice.id,
          amount: dto.amount,
          currency: dto.currency || 'USD',
          status: 'SUCCESS',
          gateway: 'MANUAL',
          paymentMethod: dto.paymentMethod || 'MANUAL_RECORD',
          metadata: { note: 'Recorded by Super Admin' },
        },
      });
    }

    return invoice;
  }

  async markInvoicePaid(id: string, paymentMethod = 'MANUAL_RECORD') {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod,
      },
    });

    // Record payment transaction
    await this.prisma.paymentTransaction.create({
      data: {
        transactionNumber: `TXN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: 'SUCCESS',
        gateway: 'MANUAL',
        paymentMethod,
        metadata: { recordedAt: new Date().toISOString() },
      },
    });

    return updatedInvoice;
  }

  async getTransactions() {
    const txns = await this.prisma.paymentTransaction.findMany({
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return txns.map((tx) => ({
      ...tx,
      amount: Number(tx.amount),
    }));
  }

  // ─── PLATFORM PLANS MANAGEMENT ───────────────────────────────────────────────

  async getPlans() {
    const plans = await this.prisma.platformPlan.findMany({
      include: {
        _count: { select: { subscriptions: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return plans.map((p) => ({
      ...p,
      monthlyPrice: Number(p.monthlyPrice),
      yearlyPrice: Number(p.yearlyPrice),
      activeSubscribersCount: p._count.subscriptions,
    }));
  }

  async createPlan(dto: CreatePlanDto) {
    return this.prisma.platformPlan.create({
      data: {
        name: dto.name,
        slug: dto.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: dto.description || null,
        monthlyPrice: dto.monthlyPrice,
        yearlyPrice: dto.yearlyPrice,
        features: dto.features,
        maxWebsites: dto.maxWebsites ?? 1,
        maxProducts: dto.maxProducts ?? 10,
        maxMediaStorageMb: dto.maxMediaStorageMb ?? 500,
        isPopular: dto.isPopular ?? false,
        isActive: dto.isActive ?? true,
      },
    });
  }
}
