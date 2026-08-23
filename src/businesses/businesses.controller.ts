import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto';
import { CurrentUser, JwtPayload } from '../common/decorators';

@ApiTags('Businesses')
@ApiBearerAuth()
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBusinessDto,
  ) {
    return this.businessesService.create(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all businesses for the current tenant' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.businessesService.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a business by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.businessesService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a business' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.businessesService.update(id, user.tenantId, dto);
  }
}
