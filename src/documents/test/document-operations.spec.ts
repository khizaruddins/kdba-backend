import { DocumentException } from '../errors/document.errors';
import { createDemoWebsiteDocument } from '../fixtures/demo-website-document';
import { DocumentOperationEngine } from '../services/document-operation.engine';
import { DocumentMigrationService } from '../services/document-migration.service';
import { DocumentValidatorService } from '../services/document-validator.service';
import { V3DocumentService } from '../services/v3-document.service';
import { WebsiteDocumentV3 } from '../types/v3.types';

function codeOf(error: unknown): string {
  if (error instanceof DocumentException) {
    return (error.getResponse() as { code: string }).code;
  }
  throw error;
}

describe('DocumentOperationEngine', () => {
  let engine: DocumentOperationEngine;
  let v3: V3DocumentService;
  let demo: WebsiteDocumentV3;

  beforeEach(() => {
    const v2 = new DocumentValidatorService();
    const migration = new DocumentMigrationService(v2);
    v3 = new V3DocumentService(v2, migration);
    engine = new DocumentOperationEngine();
    demo = v3.validate(createDemoWebsiteDocument());
  });

  it('adds a node into a valid parent', () => {
    const next = v3.validate(
      engine.applyOperation(demo, {
        type: 'addNode',
        parentId: 'column_hero_copy',
        index: 3,
        node: {
          type: 'text',
          props: { text: 'Trusted by 400+ brands' },
        },
      }),
    );

    const column = engine.findNode(next, 'column_hero_copy');
    expect(column?.node.children.some((child) => child.props.text === 'Trusted by 400+ brands')).toBe(
      true,
    );
  });

  it('rejects adding a heading directly under page-root', () => {
    try {
      engine.applyOperation(demo, {
        type: 'addNode',
        parentId: 'root_home',
        node: { type: 'heading', props: { text: 'Illegal' } },
      });
      throw new Error('expected invalid parent');
    } catch (error) {
      expect(codeOf(error)).toBe('INVALID_PARENT');
    }
  });

  it('removes a node and its descendants', () => {
    const next = engine.applyOperation(demo, {
      type: 'removeNode',
      nodeId: 'column_hero_media',
    });
    expect(engine.findNode(next, 'column_hero_media')).toBeNull();
    expect(engine.findNode(next, 'image_hero')).toBeNull();
    expect(engine.findNode(next, 'heading_hero')).not.toBeNull();
  });

  it('moves a node to a new valid parent', () => {
    const next = engine.applyOperation(demo, {
      type: 'moveNode',
      nodeId: 'button_hero',
      parentId: 'container_cta',
      index: 0,
    });
    expect(engine.findNode(next, 'button_hero')?.parent?.id).toBe('container_cta');
  });

  it('rejects moving a node into its descendant', () => {
    try {
      engine.applyOperation(demo, {
        type: 'moveNode',
        nodeId: 'section_hero',
        parentId: 'column_hero_copy',
        index: 0,
      });
      throw new Error('expected circular move');
    } catch (error) {
      expect(codeOf(error)).toBe('INVALID_PARENT');
    }
  });

  it('duplicates a node with new ids', () => {
    const next = engine.applyOperation(demo, {
      type: 'duplicateNode',
      nodeId: 'stack_feature_1',
    });
    const grid = engine.findNode(next, 'grid_features');
    expect(grid?.node.children).toHaveLength(4);
    expect(grid?.node.children.map((child) => child.id)).toEqual(
      expect.arrayContaining(['stack_feature_1']),
    );
    expect(new Set(grid?.node.children.map((child) => child.id)).size).toBe(4);
  });

  it('updates props, styles, and responsive overrides', () => {
    const next = v3.validate(
      engine.applyOperations(demo, [
        {
          type: 'updateProps',
          nodeId: 'heading_hero',
          props: { text: 'Grow Your Business Faster' },
        },
        {
          type: 'updateStyles',
          nodeId: 'heading_hero',
          styles: { typography: { fontWeight: 700 } },
        },
        {
          type: 'updateResponsive',
          nodeId: 'heading_hero',
          breakpoint: 'tablet',
          styles: { typography: { fontSize: 44 } },
        },
      ]),
    );

    const heading = engine.findNode(next, 'heading_hero')!.node;
    expect(heading.props.text).toBe('Grow Your Business Faster');
    expect(heading.styles.typography?.fontSize).toBe(56);
    expect(heading.styles.typography?.fontWeight).toBe(700);
    expect(heading.responsive.tablet?.typography?.fontSize).toBe(44);
    expect(heading.responsive.mobile?.typography?.fontSize).toBe(36);
  });

  it('reorders children', () => {
    const next = engine.applyOperation(demo, {
      type: 'reorderChildren',
      parentId: 'grid_features',
      childIds: ['stack_feature_3', 'stack_feature_1', 'stack_feature_2'],
    });
    expect(engine.findNode(next, 'grid_features')?.node.children.map((child) => child.id)).toEqual([
      'stack_feature_3',
      'stack_feature_1',
      'stack_feature_2',
    ]);
  });

  it('rolls back the entire batch when one operation is invalid', () => {
    try {
      engine.applyOperations(demo, [
        {
          type: 'updateProps',
          nodeId: 'heading_hero',
          props: { text: 'Should not persist' },
        },
        {
          type: 'addNode',
          parentId: 'root_home',
          node: { type: 'heading', props: { text: 'Illegal' } },
        },
      ]);
      throw new Error('expected batch failure');
    } catch (error) {
      expect(codeOf(error)).toBe('INVALID_PARENT');
    }

    expect(engine.findNode(demo, 'heading_hero')?.node.props.text).toBe('Grow Your Business');
  });

  it('returns NODE_NOT_FOUND for unknown targets', () => {
    try {
      engine.applyOperation(demo, {
        type: 'updateNode',
        nodeId: 'missing_node',
        changes: { props: { text: 'x' } },
      });
      throw new Error('expected missing node');
    } catch (error) {
      expect(codeOf(error)).toBe('NODE_NOT_FOUND');
    }
  });
});
