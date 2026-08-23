import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { CurrentUser, JwtPayload } from '../common/decorators';
import {
  CreateSectionDto,
  UpdateSectionConfigDto,
  ReorderSectionsDto,
} from './dto/section.dto';

@ApiTags('Sections')
@ApiBearerAuth()
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new section for a page' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSectionDto) {
    return this.sectionsService.create(user.tenantId, dto);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder sections' })
  async reorder(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ReorderSectionsDto,
  ) {
    return this.sectionsService.reorder(user.tenantId, dto.items);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle section enabled/disabled' })
  async toggle(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.sectionsService.toggle(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update section draft configuration' })
  async updateConfig(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSectionConfigDto,
  ) {
    return this.sectionsService.updateConfig(
      id,
      user.tenantId,
      dto?.config || {},
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a section' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.sectionsService.delete(id, user.tenantId);
  }
}
