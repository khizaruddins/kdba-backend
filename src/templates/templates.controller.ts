import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { TemplateValidatorService } from './services/template-validator.service';
import { CloneTemplateDto } from './dto/template.dto';
import { CurrentUser, JwtPayload, Public } from '../common/decorators';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly validatorService: TemplateValidatorService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all active templates with metadata and preview cards' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category (e.g. RESTAURANT, AGENCY, BUSINESS)' })
  @ApiQuery({ name: 'style', required: false, description: 'Filter by style tag (e.g. modern, luxury, minimal)' })
  async findAll(
    @Query('category') category?: string,
    @Query('style') style?: string,
  ) {
    return this.templatesService.findAll(category, style);
  }

  @Get('validate')
  @Public()
  @ApiOperation({ summary: 'Validate all 20 canonical niche templates against V2 schema (CI / Admin tool)' })
  async validateAll() {
    return this.validatorService.validateAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a template with its canonical WebsiteDocument structure' })
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post(':id/clone')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clone a template into a new customer website' })
  @ApiResponse({ status: 201, description: 'Website cloned successfully' })
  async clone(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CloneTemplateDto,
  ) {
    return this.templatesService.clone(id, user.tenantId, dto.businessId, dto.name);
  }
}
