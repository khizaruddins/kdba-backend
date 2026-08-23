import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { LocalStorageService } from './storage/local-storage.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, LocalStorageService],
  exports: [MediaService],
})
export class MediaModule {}
