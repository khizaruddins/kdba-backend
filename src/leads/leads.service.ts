import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto, LeadStatusEnum } from './dto/lead.dto';

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

  async getStats(tenantId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { tenantId },
      select: { status: true },
    });

    const stats = {
      total: leads.length,
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      lost: 0,
    };

    for (const lead of leads) {
      const statusKey = lead.status.toLowerCase() as keyof typeof stats;
      if (stats[statusKey] !== undefined) {
        stats[statusKey]++;
      }
    }

    return stats;
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
