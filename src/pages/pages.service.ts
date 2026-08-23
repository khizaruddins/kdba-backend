import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByWebsite(websiteId: string, tenantId: string) {
    // Verify website ownership
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website || website.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.page.findMany({
      where: { websiteId },
      include: {
        sections: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string, websiteId: string, tenantId: string) {
    // Verify website ownership
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website || website.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        sections: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!page || page.websiteId !== websiteId) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async update(
    id: string,
    websiteId: string,
    tenantId: string,
    data: { title?: string; isActive?: boolean },
  ) {
    await this.findOne(id, websiteId, tenantId); // Verify ownership

    return this.prisma.page.update({
      where: { id },
      data,
      include: {
        sections: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }
}
