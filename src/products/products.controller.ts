import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CurrentUser, JwtPayload } from '../common/decorators';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all products for current tenant' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.productsService.findAll(
      user.tenantId,
      activeOnly === 'true',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.delete(id, user.tenantId);
  }
}
