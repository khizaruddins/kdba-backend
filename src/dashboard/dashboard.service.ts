import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LeadsService } from '../leads/leads.service';
import { ProductsService } from '../products/products.service';
import { clampPeriodDays } from '../common/utils/metrics';

function money(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leadsService: LeadsService,
    private readonly productsService: ProductsService,
  ) {}

  async getOverview(tenantId: string, daysRaw?: string) {
    const days = clampPeriodDays(daysRaw);

    const [leadStats, productStats, websites, recentLeads, topProducts] =
      await Promise.all([
        this.leadsService.getStats(tenantId, String(days)),
        this.productsService.getStats(tenantId),
        this.prisma.website.findMany({
          where: { tenantId },
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.lead.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        this.prisma.product.findMany({
          where: { tenantId, isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
          take: 6,
        }),
      ]);

    const published = websites.filter((site) => site.status === 'PUBLISHED').length;

    return {
      period: leadStats.period,
      websites: {
        total: websites.length,
        published,
        draft: websites.length - published,
      },
      products: productStats,
      leads: leadStats,
      recentLeads,
      topProducts: topProducts.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        imageUrl: product.imageUrl,
        price: money(product.price),
        currency: product.currency,
        sku: product.sku,
        stock: product.stock,
        isActive: product.isActive,
      })),
      websitesPreview: websites.slice(0, 4),
    };
  }
}
