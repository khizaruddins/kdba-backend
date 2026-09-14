import { DocumentException } from '../errors/document.errors';
import { createDemoWebsiteDocument } from '../fixtures/demo-website-document';
import { DocumentOperationEngine } from '../services/document-operation.engine';
import { DocumentMigrationService } from '../services/document-migration.service';
import { DocumentValidatorService } from '../services/document-validator.service';
import { V3DocumentService } from '../services/v3-document.service';

function codeOf(error: unknown): string {
  if (error instanceof DocumentException) {
    return (error.getResponse() as { code: string }).code;
  }
  throw error;
}

describe('WebsiteDocument security', () => {
  let v3: V3DocumentService;
  let engine: DocumentOperationEngine;

  beforeEach(() => {
    const v2 = new DocumentValidatorService();
    const migration = new DocumentMigrationService(v2);
    v3 = new V3DocumentService(v2, migration);
    engine = new DocumentOperationEngine();
  });

  it('rejects javascript: URLs on buttons', () => {
    const demo = v3.validate(createDemoWebsiteDocument());
    try {
      const mutated = engine.applyOperation(demo, {
        type: 'updateProps',
        nodeId: 'button_hero',
        props: { href: 'javascript:alert(document.cookie)' },
      });
      v3.validate(mutated);
      throw new Error('expected unsafe url');
    } catch (error) {
      expect(codeOf(error)).toBe('INVALID_NODE');
    }
  });

  it('rejects script injection in heading text', () => {
    const demo = v3.validate(createDemoWebsiteDocument());
    try {
      const mutated = engine.applyOperation(demo, {
        type: 'updateProps',
        nodeId: 'heading_hero',
        props: { text: '<script>alert(1)</script>' },
      });
      v3.validate(mutated);
      throw new Error('expected xss rejection');
    } catch (error) {
      expect(codeOf(error)).toBe('INVALID_NODE');
    }
  });

  it('rejects css injection through style fields', () => {
    const demo = v3.validate(createDemoWebsiteDocument());
    try {
      engine.applyOperation(demo, {
        type: 'updateStyles',
        nodeId: 'heading_hero',
        styles: {
          background: { src: 'javascript:alert(1)' },
        },
      });
      throw new Error('expected unsafe style');
    } catch (error) {
      expect(['INVALID_NODE', 'DOCUMENT_VALIDATION_FAILED']).toContain(codeOf(error));
    }
  });

  it('rejects image mediaId values that are URLs', () => {
    const demo = v3.validate(createDemoWebsiteDocument());
    try {
      const mutated = engine.applyOperation(demo, {
        type: 'updateProps',
        nodeId: 'image_hero',
        props: { mediaId: 'https://evil.example/track.png' },
      });
      v3.validate(mutated);
      throw new Error('expected mediaId rejection');
    } catch (error) {
      expect(codeOf(error)).toBe('INVALID_NODE');
    }
  });
});
