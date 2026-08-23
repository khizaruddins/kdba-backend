import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocalStorageService } from './storage/local-storage.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: LocalStorageService,
  ) {}

  async upload(tenantId: string, file: Express.Multer.File, altText?: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const storageResult = await this.storageService.upload({
      tenantId,
      filename: file.originalname,
      buffer: file.buffer,
      mimeType: file.mimetype,
    });

    return this.prisma.media.create({
      data: {
        tenantId,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: storageResult.url,
        altText: altText || file.originalname,
        provider: storageResult.provider,
        storageKey: storageResult.storageKey,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.media.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return media;
  }

  async delete(id: string, tenantId: string) {
    const media = await this.findOne(id, tenantId);

    await this.storageService.delete(media.storageKey);

    return this.prisma.media.delete({
      where: { id },
    });
  }

  getFilePath(storageKey: string): string {
    return this.storageService.getFilePath(storageKey);
  }
}
