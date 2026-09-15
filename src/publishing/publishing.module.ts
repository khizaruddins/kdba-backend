import { Module } from '@nestjs/common';
import { PublishingController } from './publishing.controller';
import { PublishingService } from './publishing.service';
import { WebsitesModule } from '../websites/websites.module';
import { CmsModule } from '../cms/cms.module';

@Module({
  imports: [WebsitesModule, CmsModule],
  controllers: [PublishingController],
  providers: [PublishingService],
  exports: [PublishingService],
})
export class PublishingModule {}
