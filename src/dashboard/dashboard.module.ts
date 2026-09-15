import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { LeadsModule } from '../leads/leads.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [LeadsModule, ProductsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
