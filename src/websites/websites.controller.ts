import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WebsitesService } from './websites.service';
import {
  CreateWebsiteDto,
  UpdateWebsiteDto,
  SaveWebsiteDocumentDto,
  MutateWebsiteDocumentDto,
  ApplyDocumentOperationsDto,
  DuplicateWebsiteDto,
  CreateVersionDto,
  RestoreVersionDto,
} from './dto';
import { CurrentUser, JwtPayload } from '../common/decorators';

@ApiTags('Websites')
@ApiBearerAuth()
@Controller('websites')
export class WebsitesController {
  constructor(private readonly websitesService: WebsitesService) {}

  @Get('components/registry')
  @ApiOperation({ summary: 'Get visual builder Component Registry manifest (capabilities, schemas, allowed children, default props/styles)' })
  async getComponentRegistry() {
    return this.websitesService.getComponentRegistry();
  }

  @Post()
  @ApiOperation({ summary: 'Create a website from a template' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateWebsiteDto) {
    return this.websitesService.create(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all websites for the current tenant' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.websitesService.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a website with draft & published documents and relations' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.websitesService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update top-level website settings' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateWebsiteDto,
  ) {
    return this.websitesService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a website and its versions' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.websitesService.delete(id, user.tenantId);
  }

  // ─── V3 CANONICAL DOCUMENT & VISUAL BUILDER APIS ─────────────────────────────

  @Get(':id/document')
  @ApiOperation({ summary: 'Get canonical WebsiteDocument V3.0 (Draft state) with revision metadata and document hash' })
  async getDocument(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.websitesService.getDocument(id, user.tenantId);
  }

  @Put(':id/document')
  @ApiOperation({ summary: 'Save full draft WebsiteDocument with strict schema validation and optimistic concurrency check' })
  @ApiResponse({ status: 200, description: 'Document validated and saved successfully' })
  @ApiResponse({ status: 409, description: 'Concurrency conflict (document modified in another session)' })
  async updateDocument(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SaveWebsiteDocumentDto,
  ) {
    return this.websitesService.updateDocument(id, user.tenantId, dto);
  }

  @Post(':id/document/operations')
  @ApiOperation({ summary: 'Apply fine-grained visual document operations transactionally with revision verification' })
  @ApiResponse({ status: 200, description: 'Operations applied and document revision incremented' })
  @ApiResponse({ status: 409, description: 'Document revision conflict (DOCUMENT_REVISION_CONFLICT)' })
  async applyOperations(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ApplyDocumentOperationsDto,
  ) {
    return this.websitesService.applyOperations(id, user.tenantId, dto);
  }

  @Post(':id/document/batch')
  @ApiOperation({ summary: 'Execute transactional batch of document operations (alias for /operations)' })
  async applyBatchOperations(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ApplyDocumentOperationsDto,
  ) {
    return this.websitesService.applyOperations(id, user.tenantId, dto);
  }

  @Patch(':id/document/mutations')
  @ApiOperation({ summary: 'Legacy V2 mutation endpoint (backward compatibility)' })
  async mutateDocument(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: MutateWebsiteDocumentDto,
  ) {
    return this.websitesService.mutateDocument(id, user.tenantId, dto);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Get rendered preview representation of draft document' })
  async getPreview(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.websitesService.getPreview(id, user.tenantId);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish website: validate draft, create version snapshot, and promote to live publishedDocument' })
  async publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.websitesService.publish(id, user.tenantId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an entire website with fresh unique IDs for all nested nodes' })
  async duplicate(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: DuplicateWebsiteDto,
  ) {
    return this.websitesService.duplicateWebsite(id, user.tenantId, dto);
  }

  // ─── VERSIONING & HISTORY APIS ──────────────────────────────────────────────

  @Get(':id/versions')
  @ApiOperation({ summary: 'List historical version snapshots for website' })
  async getVersions(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.websitesService.getVersions(id, user.tenantId);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create a named manual version snapshot of draft document' })
  async createVersion(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateVersionDto,
  ) {
    return this.websitesService.createVersionSnapshot(
      id,
      user.tenantId,
      dto.reason,
      user.sub,
    );
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a historical version snapshot to draft document' })
  async restoreVersion(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RestoreVersionDto,
  ) {
    return this.websitesService.restoreVersion(id, user.tenantId, dto.versionId);
  }
}
