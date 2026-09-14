import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { getBuilderCatalogWithPresetTrees } from './contracts/builder-catalog';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  @Get('catalog')
  @ApiOperation({
    summary:
      'Builder catalog: component metadata, section presets, and theme tokens',
  })
  getCatalog() {
    return getBuilderCatalogWithPresetTrees();
  }
}
