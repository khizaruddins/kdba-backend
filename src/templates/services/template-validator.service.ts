import { Injectable, Logger } from '@nestjs/common';
import { DocumentValidatorService } from '../../documents/services/document-validator.service';
import { ALL_NICHE_TEMPLATES } from '../data/definitions';

export interface TemplateValidationReport {
  total: number;
  validCount: number;
  invalidCount: number;
  results: Array<{
    id: string;
    name: string;
    slug: string;
    isValid: boolean;
    errors?: Array<{ path: string; message: string }>;
  }>;
}

@Injectable()
export class TemplateValidatorService {
  private readonly logger = new Logger(TemplateValidatorService.name);

  constructor(private readonly validator: DocumentValidatorService) {}

  /**
   * Validate all 20 canonical niche templates.
   */
  validateAll(): TemplateValidationReport {
    const results: TemplateValidationReport['results'] = [];
    let validCount = 0;
    let invalidCount = 0;

    for (const template of ALL_NICHE_TEMPLATES) {
      const check = this.validator.safeValidate(template.document);

      if (check.isValid) {
        validCount++;
        results.push({
          id: template.id,
          name: template.name,
          slug: template.slug,
          isValid: true,
        });
      } else {
        invalidCount++;
        this.logger.error(
          `Template "${template.name}" (${template.id}) failed validation: ${JSON.stringify(check.errors)}`,
        );
        results.push({
          id: template.id,
          name: template.name,
          slug: template.slug,
          isValid: false,
          errors: check.errors,
        });
      }
    }

    return {
      total: ALL_NICHE_TEMPLATES.length,
      validCount,
      invalidCount,
      results,
    };
  }
}
