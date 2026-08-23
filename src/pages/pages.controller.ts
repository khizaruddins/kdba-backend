import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PagesService } from './pages.service';
import { CurrentUser, JwtPayload } from '../common/decorators';

@ApiTags('Pages')
@ApiBearerAuth()
@Controller('websites/:websiteId/pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  @ApiOperation({ summary: 'List pages for a website' })
  async findAll(
    @Param('websiteId') websiteId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.pagesService.findAllByWebsite(websiteId, user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a page with sections' })
  async findOne(
    @Param('websiteId') websiteId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.pagesService.findOne(id, websiteId, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a page' })
  async update(
    @Param('websiteId') websiteId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { title?: string; isActive?: boolean },
  ) {
    return this.pagesService.update(id, websiteId, user.tenantId, body);
  }
}
