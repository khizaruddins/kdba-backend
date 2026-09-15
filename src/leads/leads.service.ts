import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import {
  clampPeriodDays,
  dateKeyUtc,
  emptyDailySeries,
  percentChange,
  periodWindow,
} from '../common/utils/metrics';

const EMPTY_STATUS = {
  total: 0,
  new: 0,
  contacted: 0,
  qualified: 0,
  converted: 0,
  lost: 0,
};

function tallyStatuses(
  leads: Array<{ status: string }>,
): typeof EMPTY_STATUS {
  const stats = { ...EMPTY_STATUS, total: leads.length };
  for (const lead of leads) {
    const statusKey = lead.status.toLowerCase() as keyof typeof stats;
    if (statusKey !== 'total' && stats[statusKey] !== undefined) {
      stats[statusKey] += 1;
    }
  }
  return stats;
}

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        message: dto.message,
        source: dto.source || 'website',
        status: 'NEW',
      },
    });
  }

  async findAll(
    tenantId: string,
    query?: { status?: string; search?: string },
  ) {
    return this.prisma.lead.findMany({
      where: {
        tenantId,
        ...(query?.status ? { status: query.status as any } : {}),
        ...(query?.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { message: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(tenantId: string, daysRaw?: string) {
    const days = clampPeriodDays(daysRaw);
    const { periodStart, periodEnd, previousStart } = periodWindow(days);

    const [allLeads, periodLeads, previousLeads] = await Promise.all([
      this.prisma.lead.findMany({
        where: { tenantId },
        select: { status: true, createdAt: true },
      }),
      this.prisma.lead.findMany({
        where: {
          tenantId,
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        select: { status: true, createdAt: true },
      }),
      this.prisma.lead.findMany({
        where: {
          tenantId,
          createdAt: { gte: previousStart, lt: periodStart },
        },
        select: { status: true },
      }),
    ]);

    const all = tallyStatuses(allLeads);
    const current = tallyStatuses(periodLeads);
    const previous = tallyStatuses(previousLeads);

    const buckets = new Map(
      emptyDailySeries(periodStart, days).map((row) => [row.date, row]),
    );
    for (const lead of periodLeads) {
      const key = dateKeyUtc(lead.createdAt);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.count += 1;
      if (lead.status === 'CONVERTED') bucket.converted += 1;
    }

    return {
      ...all,
      period: {
        days,
        from: periodStart.toISOString(),
        to: periodEnd.toISOString(),
      },
      periodCounts: current,
      previousCounts: previous,
      change: {
        total: percentChange(current.total, previous.total),
        new: percentChange(current.new, previous.new),
        converted: percentChange(current.converted, previous.converted),
      },
      conversionRate:
        all.total > 0 ? Math.round((all.converted / all.total) * 1000) / 10 : 0,
      series: Array.from(buckets.values()),
    };
  }

  async findOne(id: string, tenantId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return lead;
  }

  async update(id: string, tenantId: string, dto: UpdateLeadDto) {
    await this.findOne(id, tenantId);

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.message !== undefined && { message: dto.message }),
      },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.lead.delete({
      where: { id },
    });
  }
}
