import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StorageService, UploadFileOptions, StorageResult } from './storage.interface';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = path.resolve(
      process.cwd(),
      this.configService.get<string>('UPLOAD_DIR', './uploads'),
    );

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(options: UploadFileOptions): Promise<StorageResult> {
    const ext = path.extname(options.filename) || '.bin';
    const hash = crypto.randomBytes(16).toString('hex');
    const storageKey = `${options.tenantId}_${Date.now()}_${hash}${ext}`;
    const filePath = path.join(this.uploadDir, storageKey);

    await fs.promises.writeFile(filePath, options.buffer);

    // URL to serve via media controller
    const url = `/api/v1/media/file/${storageKey}`;

    return {
      url,
      storageKey,
      provider: 'local',
    };
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, storageKey);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch {
      return false;
    }
  }

  async getUrl(storageKey: string): Promise<string> {
    return `/api/v1/media/file/${storageKey}`;
  }

  getFilePath(storageKey: string): string {
    return path.join(this.uploadDir, storageKey);
  }
}
