import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  UpdateTenantStatusDto,
  CreateInvoiceDto,
  UpdateSubscriptionDto,
  CreatePlanDto,
} from './dto/admin-governance.dto';
import { JwtAuthGuard, SuperAdminGuard } from '../common/guards';
import { TenantStatus, InvoiceStatus } from '@prisma/client';

import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Super Admin Governance')
@ApiBearerAuth()
@SkipThrottle()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class AdminGovernanceController {
  constructor(private readonly adminService: AdminService) {}

  // ─── PLATFORM METRICS & FINANCIAL REVENUE ───────────────────────────────────

  @Get('overview')
  @ApiOperation({
    summary:
      'Get total platform earnings, MRR, active tenants, and revenue trend',
  })
  async getOverview() {
    return this.adminService.getOverview();
  }

  // ─── TENANTS GOVERNANCE ─────────────────────────────────────────────────────

  @Get('tenants')
  @ApiOperation({
    summary: 'List all platform tenants with search, status, and spend',
  })
  async getTenants(
    @Query('search') search?: string,
    @Query('status') status?: TenantStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getTenants({ search, status, page, limit });
  }

  @Get('tenants/:id')
  @ApiOperation({
    summary:
      'Get full tenant details (users, sites, businesses, subscriptions, bills)',
  })
  async getTenantDetails(@Param('id') id: string) {
    return this.adminService.getTenantDetails(id);
  }

  @Patch('tenants/:id/status')
  @ApiOperation({ summary: 'Block, unblock, or suspend a tenant' })
  async updateTenantStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTenantStatusDto,
  ) {
    return this.adminService.updateTenantStatus(id, dto);
  }

  // ─── SUBSCRIPTIONS & PLANS ──────────────────────────────────────────────────

  @Get('subscriptions')
  @ApiOperation({ summary: 'List all tenant subscriptions' })
  async getSubscriptions() {
    return this.adminService.getSubscriptions();
  }

  @Patch('subscriptions/:id')
  @ApiOperation({ summary: 'Update tenant subscription tier or status' })
  async updateSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.adminService.updateSubscription(id, dto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List platform plans' })
  async getPlans() {
    return this.adminService.getPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create new platform plan' })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.adminService.createPlan(dto);
  }

  // ─── INVOICES & BILLS ───────────────────────────────────────────────────────

  @Get('invoices')
  @ApiOperation({ summary: 'List all platform invoices / bills' })
  async getInvoices(
    @Query('status') status?: InvoiceStatus,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.adminService.getInvoices({ status, tenantId });
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Generate manual invoice for a tenant' })
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.adminService.createInvoice(dto);
  }

  @Patch('invoices/:id/pay')
  @ApiOperation({ summary: 'Mark an invoice as paid and record transaction' })
  async markInvoicePaid(
    @Param('id') id: string,
    @Body('paymentMethod') paymentMethod?: string,
  ) {
    return this.adminService.markInvoicePaid(id, paymentMethod);
  }

  // ─── PAYMENT TRANSACTIONS LEDGER ────────────────────────────────────────────

  @Get('transactions')
  @ApiOperation({
    summary:
      'Live ledger of all incoming payment transactions and platform earnings',
  })
  async getTransactions() {
    return this.adminService.getTransactions();
  }
}
