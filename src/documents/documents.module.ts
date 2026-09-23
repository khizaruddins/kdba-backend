import { Module, Global } from '@nestjs/common';
import { DocumentValidatorService } from './services/document-validator.service';
import { DocumentMigrationService } from './services/document-migration.service';
import { TreeOperationsService } from './services/tree-operations.service';
import { ResponsiveResolverService } from './services/responsive-resolver.service';

@Global()
@Module({
  providers: [
    DocumentValidatorService,
    DocumentMigrationService,
    TreeOperationsService,
    ResponsiveResolverService,
  ],
  exports: [
    DocumentValidatorService,
    DocumentMigrationService,
    TreeOperationsService,
    ResponsiveResolverService,
  ],
})
export class DocumentsModule {}
