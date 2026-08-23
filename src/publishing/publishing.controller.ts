import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PublishingService } from './publishing.service';
import { CreateLeadDto } from '../leads/dto/lead.dto';
import { CurrentUser, JwtPayload, Public } from '../common/decorators';

@ApiTags('Publishing & Public Site')
@Controller()
export class PublishingController {
  constructor(private readonly publishingService: PublishingService) {}

  @Post('websites/:id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish website (promote draft to live)' })
  async publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.publishingService.publish(id, user.tenantId);
  }

  @Get('public/sites/:slug')
  @Public()
  @ApiOperation({ summary: 'Get published website data for rendering' })
  async getPublicWebsite(@Param('slug') slug: string) {
    return this.publishingService.getPublicWebsite(slug);
  }

  @Post('public/sites/:slug/contact')
  @Public()
  @ApiOperation({ summary: 'Submit contact form for public website' })
  async submitContact(@Param('slug') slug: string, @Body() dto: CreateLeadDto) {
    return this.publishingService.submitContact(slug, dto);
  }
}
