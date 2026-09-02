import { Module, Global } from '@nestjs/common';
import { DocumentValidatorService } from './services/document-validator.service';
import { DocumentMigrationService } from './services/document-migration.service';
import { TreeOperationsService } from './services/tree-operations.service';

@Global()
@Module({
  providers: [
    DocumentValidatorService,
    DocumentMigrationService,
    TreeOperationsService,
  ],
  exports: [
    DocumentValidatorService,
    DocumentMigrationService,
    TreeOperationsService,
  ],
})
export class DocumentsModule {}
