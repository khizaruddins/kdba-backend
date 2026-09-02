import { Module, Global } from '@nestjs/common';
import { DocumentValidatorService } from './services/document-validator.service';
import { DocumentMigrationService } from './services/document-migration.service';

@Global()
@Module({
  providers: [DocumentValidatorService, DocumentMigrationService],
  exports: [DocumentValidatorService, DocumentMigrationService],
})
export class DocumentsModule {}
