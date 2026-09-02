import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  StorageService,
  UploadFileOptions,
  StorageResult,
} from './storage.interface';

interface SupabaseClientLike {
  storage: {
    from: (bucket: string) => {
      upload: (
        key: string,
        body: Buffer,
        options: any,
      ) => Promise<{ error: any; data: any }>;
      remove: (keys: string[]) => Promise<{ error: any; data: any }>;
      getPublicUrl: (key: string) => { data: { publicUrl: string } };
    };
  };
}

@Injectable()
export class SupabaseStorageService implements StorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly supabase: SupabaseClientLike | null = null;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey =
      this.configService.get<string>('SUPABASE_SECRET_KEY') ||
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_KEY') ||
      this.configService.get<string>('SUPABASE_ANON_PUBLIC');

    this.bucket =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') ||
      this.configService.get<string>('SUPABASE_BUCKET', 'kdba-bucket');

    if (supabaseUrl && supabaseKey) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createClient } = require('@supabase/supabase-js');
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.logger.log(
          `Initialized Supabase Storage client (Bucket: ${this.bucket})`,
        );
      } catch {
        this.logger.warn(
          '@supabase/supabase-js module not available. Uploads to Supabase will fail.',
        );
      }
    } else {
      this.logger.warn(
        'Supabase credentials (SUPABASE_URL, SUPABASE_KEY) are not defined. Uploads to Supabase will fail.',
      );
    }
  }

  async upload(options: UploadFileOptions): Promise<StorageResult> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        'Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_KEY in your environment.',
      );
    }

    const ext = path.extname(options.filename) || '';
    const baseName = path
      .basename(options.filename, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const hash = crypto.randomBytes(6).toString('hex');
    const storageKey = `${options.tenantId}/${Date.now()}_${hash}_${baseName}${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(storageKey, options.buffer, {
        contentType: options.mimeType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Supabase upload failed: ${error.message}`, error);
      throw new InternalServerErrorException(
        `Failed to upload file to Supabase: ${error.message}`,
      );
    }

    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(storageKey);

    return {
      url: data.publicUrl,
      storageKey,
      provider: 'supabase',
    };
  }

  async delete(storageKey: string): Promise<boolean> {
    if (!this.supabase) {
      return false;
    }

    try {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([storageKey]);

      if (error) {
        this.logger.error(
          `Failed to delete file from Supabase: ${error.message}`,
        );
        return false;
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to delete file from Supabase: ${msg}`);
      return false;
    }
  }

  getUrl(storageKey: string): Promise<string> {
    if (!this.supabase) {
      return Promise.resolve('');
    }

    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(storageKey);

    return Promise.resolve(data.publicUrl);
  }
}
