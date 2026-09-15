import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { getBuilderCatalogWithPresetTrees } from './contracts/builder-catalog';
import { buildBlockTree, getBlockDefinition, listBlockCategories, listBlocks as listBlockDefinitions } from './contracts/block-registry';
import { CONTACT_FORM_VARIANTS, listFormFieldCatalog } from './contracts/form-fields';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  @Get('catalog')
  @ApiOperation({
    summary:
      'Builder catalog: component metadata, blocks, section presets, form fields, and theme tokens',
  })
  getCatalog() {
    return getBuilderCatalogWithPresetTrees();
  }

  @Get('blocks')
  @ApiOperation({ summary: 'List reusable block definitions for the visual builder' })
  @ApiQuery({ name: 'category', required: false, type: String })
  listDocumentBlocks(@Query('category') category?: string) {
    return {
      categories: listBlockCategories(),
      contactVariants: [...CONTACT_FORM_VARIANTS],
      formFields: listFormFieldCatalog(),
      blocks: listBlockDefinitions(category),
    };
  }

  @Get('blocks/:id')
  @ApiOperation({ summary: 'Get one block definition and the WebsiteDocument subtree it inserts' })
  getBlock(@Param('id') id: string) {
    const definition = getBlockDefinition(id);
    if (!definition) {
      throw new NotFoundException(`Unknown block "${id}"`);
    }
    return {
      id: definition.id,
      name: definition.name,
      category: definition.category,
      description: definition.description,
      icon: definition.icon,
      tags: definition.tags,
      allowedParents: definition.allowedParents,
      variant: definition.variant,
      version: definition.version,
      tree: buildBlockTree(id),
    };
  }
}
