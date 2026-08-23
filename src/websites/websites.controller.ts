import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebsitesService } from './websites.service';
import { CreateWebsiteDto, UpdateWebsiteDto } from './dto';
import { CurrentUser, JwtPayload } from '../common/decorators';

@ApiTags('Websites')
@ApiBearerAuth()
@Controller('websites')
export class WebsitesController {
  constructor(private readonly websitesService: WebsitesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a website from a template' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWebsiteDto,
  ) {
    return this.websitesService.create(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all websites for the current tenant' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.websitesService.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a website with pages and sections' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.websitesService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update website settings' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateWebsiteDto,
  ) {
    return this.websitesService.update(id, user.tenantId, dto);
  }
}
