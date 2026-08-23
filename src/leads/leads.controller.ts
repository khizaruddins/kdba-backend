import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { UpdateLeadDto, LeadStatusEnum } from './dto/lead.dto';
import { CurrentUser, JwtPayload } from '../common/decorators';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List all leads for current tenant' })
  @ApiQuery({ name: 'status', required: false, enum: LeadStatusEnum })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.leadsService.findAll(user.tenantId, { status, search });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get lead status counts/metrics' })
  async getStats(@CurrentUser() user: JwtPayload) {
    return this.leadsService.getStats(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lead by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.leadsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead status' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lead' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.leadsService.delete(id, user.tenantId);
  }
}
