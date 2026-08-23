import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify that a section belongs to the given tenant by traversing
   * section → page → website → tenant.
   */
  private async verifySectionOwnership(sectionId: string, tenantId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        page: {
          include: {
            website: { select: { tenantId: true } },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (section.page.website.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return section;
  }

  async create(
    tenantId: string,
    dto: {
      pageId: string;
      type: string;
      title: string;
      config?: Record<string, unknown>;
      sortOrder?: number;
    },
  ) {
    const page = await this.prisma.page.findUnique({
      where: { id: dto.pageId },
      include: {
        website: { select: { tenantId: true } },
      },
    });

    if (!page || page.website.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.section.create({
      data: {
        pageId: dto.pageId,
        type: dto.type as any,
        title: dto.title,
        draftConfig: (dto.config || {}) as any,
        sortOrder: dto.sortOrder ?? 1,
        enabled: true,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.verifySectionOwnership(id, tenantId);
    return this.prisma.section.delete({
      where: { id },
    });
  }

  async updateConfig(
    id: string,
    tenantId: string,
    config: Record<string, unknown>,
  ) {
    await this.verifySectionOwnership(id, tenantId);

    return this.prisma.section.update({
      where: { id },
      data: { draftConfig: config as any },
    });
  }

  async toggle(id: string, tenantId: string) {
    const section = await this.verifySectionOwnership(id, tenantId);

    return this.prisma.section.update({
      where: { id },
      data: { enabled: !section.enabled },
    });
  }

  async reorder(
    tenantId: string,
    items: Array<{ id: string; sortOrder: number }>,
  ) {
    // Verify all sections belong to tenant
    for (const item of items) {
      await this.verifySectionOwnership(item.id, tenantId);
    }

    // Update sort orders in a transaction
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.section.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
  }
}
