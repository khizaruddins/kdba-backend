import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { SupabaseStorageService } from './storage/supabase-storage.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, SupabaseStorageService],
  exports: [MediaService, SupabaseStorageService],
})
export class MediaModule {}
