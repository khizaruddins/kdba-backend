import { Module, Global } from '@nestjs/common';
import { DocumentValidatorService } from './services/document-validator.service';
import { DocumentMigrationService } from './services/document-migration.service';
import { TreeOperationsService } from './services/tree-operations.service';
import { V3DocumentService } from './services/v3-document.service';
import { DocumentOperationEngine } from './services/document-operation.engine';
import { DocumentsController } from './documents.controller';

@Global()
@Module({
  controllers: [DocumentsController],
  providers: [
    DocumentValidatorService,
    DocumentMigrationService,
    TreeOperationsService,
    V3DocumentService,
    DocumentOperationEngine,
  ],
  exports: [
    DocumentValidatorService,
    DocumentMigrationService,
    TreeOperationsService,
    V3DocumentService,
    DocumentOperationEngine,
  ],
})
export class DocumentsModule {}
