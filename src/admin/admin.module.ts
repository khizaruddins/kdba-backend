import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AdminService } from './admin.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminGovernanceController } from './admin-governance.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule, JwtModule.register({})],
  controllers: [AdminAuthController, AdminGovernanceController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
