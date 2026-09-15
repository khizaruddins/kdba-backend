import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '../common/decorators';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Workspace overview: KPIs, lead series, catalog, recent activity' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async overview(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: string,
  ) {
    return this.dashboardService.getOverview(user.tenantId, days);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Alias for GET /dashboard' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async overviewAlias(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: string,
  ) {
    return this.dashboardService.getOverview(user.tenantId, days);
  }
}
