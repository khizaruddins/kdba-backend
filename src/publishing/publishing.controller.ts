import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PublishingService } from './publishing.service';
import { CreateLeadDto } from '../leads/dto/lead.dto';
import { CurrentUser, JwtPayload, Public } from '../common/decorators';
import { CmsService } from '../cms/cms.service';
import { QueryCmsRecordsDto } from '../cms/dto/cms.dto';

@ApiTags('Publishing & Public Site')
@Controller()
export class PublishingController {
  constructor(
    private readonly publishingService: PublishingService,
    private readonly cmsService: CmsService,
  ) {}

  @Post('websites/:id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish website (promote draft to live)' })
  async publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.publishingService.publish(id, user.tenantId);
  }

  @Get('public/sites/:slug')
  @Public()
  @ApiOperation({
    summary:
      'Get website data for rendering. Slug returns the published site only; website id also renders an unpublished draft for editor Preview.',
  })
  async getPublicWebsite(@Param('slug') slug: string) {
    return this.publishingService.getPublicWebsite(slug);
  }

  @Post('public/sites/:slug/contact')
  @Public()
  @ApiOperation({ summary: 'Submit contact form for public website' })
  async submitContact(@Param('slug') slug: string, @Body() dto: CreateLeadDto) {
    return this.publishingService.submitContact(slug, dto);
  }

  @Get('public/sites/:slug/cms/:collectionSlug')
  @Public()
  @ApiOperation({ summary: 'List published CMS records for a public site collection' })
  async listPublicCms(
    @Param('slug') slug: string,
    @Param('collectionSlug') collectionSlug: string,
    @Query() query: QueryCmsRecordsDto,
  ) {
    return this.cmsService.listPublicRecords(slug, collectionSlug, query);
  }

  @Get('public/sites/:slug/cms/:collectionSlug/:recordSlug')
  @Public()
  @ApiOperation({ summary: 'Get one published CMS record by slug' })
  async getPublicCmsRecord(
    @Param('slug') slug: string,
    @Param('collectionSlug') collectionSlug: string,
    @Param('recordSlug') recordSlug: string,
  ) {
    return this.cmsService.getPublicRecord(slug, collectionSlug, recordSlug);
  }
}
