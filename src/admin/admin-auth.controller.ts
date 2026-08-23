import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminRegisterDto, AdminLoginDto } from './dto/admin-auth.dto';
import { Public, CurrentUser, JwtPayload } from '../common/decorators';
import { JwtAuthGuard, SuperAdminGuard } from '../common/guards';

import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Super Admin Auth')
@SkipThrottle()
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a Super Admin using Secret Key' })
  async register(@Body() dto: AdminRegisterDto) {
    return this.adminService.registerAdmin(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Super Admin Login' })
  async login(@Body() dto: AdminLoginDto) {
    return this.adminService.loginAdmin(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Get current Super Admin profile' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.adminService.getAdminProfile(user.sub);
  }
}
