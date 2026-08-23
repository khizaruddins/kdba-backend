import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { BusinessesModule } from './businesses/businesses.module';
import { TemplatesModule } from './templates/templates.module';
import { WebsitesModule } from './websites/websites.module';
import { PagesModule } from './pages/pages.module';
import { SectionsModule } from './sections/sections.module';
import { MediaModule } from './media/media.module';
import { ProductsModule } from './products/products.module';
import { PricingModule } from './pricing/pricing.module';
import { LeadsModule } from './leads/leads.module';
import { PublishingModule } from './publishing/publishing.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 30,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 500,
      },
    ]),

    // Core
    PrismaModule,

    // Feature modules
    AuthModule,
    AdminModule,
    UsersModule,
    TenantsModule,
    BusinessesModule,
    TemplatesModule,
    WebsitesModule,
    PagesModule,
    SectionsModule,
    MediaModule,
    ProductsModule,
    PricingModule,
    LeadsModule,
    PublishingModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
