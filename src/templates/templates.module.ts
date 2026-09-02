import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TemplateValidatorService } from './services/template-validator.service';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplateValidatorService],
  exports: [TemplatesService, TemplateValidatorService],
})
export class TemplatesModule {}
