import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '../common/decorators';
import { CmsService } from './cms.service';
import {
  CreateCmsCollectionDto,
  CreateCmsRecordDto,
  QueryCmsRecordsDto,
  UpdateBusinessProfileDto,
  UpdateCmsCollectionDto,
  UpdateCmsRecordDto,
} from './dto/cms.dto';

@ApiTags('CMS')
@ApiBearerAuth()
@Controller('websites/:websiteId/cms')
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'CMS field types, binding metadata, and builtin collection presets' })
  catalog() {
    return this.cms.getCatalog();
  }

  @Post('bootstrap')
  @ApiOperation({ summary: 'Ensure builtin business collections exist for this website' })
  bootstrap(@Param('websiteId') websiteId: string, @CurrentUser() user: JwtPayload) {
    return this.cms.bootstrap(websiteId, user.tenantId);
  }

  @Get('business-profile')
  @ApiOperation({ summary: 'Get website business profile used by CMS, SEO, and publishing' })
  getProfile(@Param('websiteId') websiteId: string, @CurrentUser() user: JwtPayload) {
    return this.cms.getBusinessProfile(websiteId, user.tenantId);
  }

  @Patch('business-profile')
  @ApiOperation({ summary: 'Update business profile and website favicon' })
  updateProfile(
    @Param('websiteId') websiteId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBusinessProfileDto,
  ) {
    return this.cms.updateBusinessProfile(websiteId, user.tenantId, dto);
  }

  @Get('collections')
  @ApiOperation({ summary: 'List CMS collections for a website' })
  listCollections(@Param('websiteId') websiteId: string, @CurrentUser() user: JwtPayload) {
    return this.cms.listCollections(websiteId, user.tenantId);
  }

  @Post('collections')
  @ApiOperation({ summary: 'Create a CMS collection or instantiate a builtin preset' })
  createCollection(
    @Param('websiteId') websiteId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCmsCollectionDto,
  ) {
    return this.cms.createCollection(websiteId, user.tenantId, dto);
  }

  @Get('collections/:collectionId')
  @ApiOperation({ summary: 'Get a CMS collection schema' })
  getCollection(
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cms.getCollection(websiteId, user.tenantId, collectionId);
  }

  @Patch('collections/:collectionId')
  @ApiOperation({ summary: 'Update a CMS collection schema' })
  updateCollection(
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCmsCollectionDto,
  ) {
    return this.cms.updateCollection(websiteId, user.tenantId, collectionId, dto);
  }

  @Delete('collections/:collectionId')
  @ApiOperation({ summary: 'Soft-delete a CMS collection and its records' })
  deleteCollection(
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cms.deleteCollection(websiteId, user.tenantId, collectionId);
  }

  @Post('collections/:collectionId/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted CMS collection' })
  restoreCollection(
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cms.restoreCollection(websiteId, user.tenantId, collectionId);
  }

  @Get('collections/:collectionId/records')
  @ApiOperation({ summary: 'List, search, filter, sort, and paginate CMS records' })
  listRecords(
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryCmsRecordsDto,
  ) {
    return this.cms.listRecords(websiteId, user.tenantId, collectionId, query);
  }

  @Post('collections/:collectionId/records')
  @ApiOperation({ summary: 'Create a CMS record' })
  createRecord(
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCmsRecordDto,
  ) {
    return this.cms.createRecord(websiteId, user.tenantId, collectionId, dto);
  }

  @Get('collections/:collectionId/records/:recordId')
  @ApiOperation({ summary: 'Get a CMS record' })
  getRecord(
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Param('recordId') recordId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cms.getRecord(websiteId, user.tenantId, collectionId, recordId);
  }

  @Patch('collections/:collectionId/records/:recordId')
  @ApiOperation({ summary: 'Update a CMS record' })
  updateRecord(
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Param('recordId') recordId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCmsRecordDto,
  ) {
    return this.cms.updateRecord(websiteId, user.tenantId, collectionId, recordId, dto);
  }

  @Delete('collections/:collectionId/records/:recordId')
  @ApiOperation({ summary: 'Soft-delete a CMS record' })
  deleteRecord(
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Param('recordId') recordId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cms.deleteRecord(websiteId, user.tenantId, collectionId, recordId);
  }

  @Post('collections/:collectionId/records/:recordId/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted CMS record' })
  restoreRecord(
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Param('recordId') recordId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cms.restoreRecord(websiteId, user.tenantId, collectionId, recordId);
  }

  @Get('collections/:collectionId/records/:recordId/revisions')
  @ApiOperation({ summary: 'List recent CMS record revisions' })
  listRevisions(
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Param('recordId') recordId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cms.listRevisions(websiteId, user.tenantId, collectionId, recordId);
  }

  @Post('collections/:collectionId/records/:recordId/revisions/:revisionId/restore')
  @ApiOperation({ summary: 'Restore a CMS record from a revision snapshot' })
  restoreRevision(
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Param('recordId') recordId: string,
    @Param('revisionId') revisionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cms.restoreRevision(
      websiteId,
      user.tenantId,
      collectionId,
      recordId,
      revisionId,
    );
  }
}
