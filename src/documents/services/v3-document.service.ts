import { HttpStatus, Injectable } from '@nestjs/common';
import { ZodIssue } from 'zod';
import { isValidSectionType, isValidVariant, SECTION_REGISTRY } from '../contracts/section-registry';
import { canNest, isLeafNode, isNodeType, NODE_REGISTRY } from '../contracts/node-registry';
import {
  DocumentErrorCode,
  DocumentException,
  documentValidationFailed,
} from '../errors/document.errors';
import { WebsiteDocumentV3Schema } from '../schemas/v3.schema';
import { assertSafeCssValue, sanitizeUnknown } from '../security/document-security';
import {
  DOCUMENT_LIMITS,
  PageContractV3,
  StyleModel,
  ThemeConfigV3,
  VisualNode,
  WebsiteDocumentV3,
} from '../types/v3.types';
import { WebsiteDocument } from '../types/document.types';
import { DocumentValidatorService } from './document-validator.service';
import { DocumentMigrationService } from './document-migration.service';
import { countNodes, maxDepth } from './document-tree';
import { coerceV3Document } from './document-coerce';
import { pruneEmptyStyles, pruneResponsiveOverrides } from './responsive';

@Injectable()
export class V3DocumentService {
  constructor(
    private readonly v2Validator: DocumentValidatorService,
    private readonly migrationService: DocumentMigrationService,
  ) {}

  isV3(document: unknown): document is WebsiteDocumentV3 {
    return (
      !!document &&
      typeof document === 'object' &&
      (document as { schemaVersion?: string }).schemaVersion === '3.0'
    );
  }

  ensureV3(document: unknown): WebsiteDocumentV3 {
    if (!document || typeof document !== 'object') {
      throw new DocumentException(
        DocumentErrorCode.DOCUMENT_VALIDATION_FAILED,
        'Website document must be a non-null object',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (this.isV3(document)) {
      return this.validate(document);
    }

    const version = (document as { schemaVersion?: string }).schemaVersion;
    if (version === '2.0') {
      const v2 = this.v2Validator.validateV2(document);
      return this.validate(this.migrationService.migrateV2ToEditorDocument(v2));
    }

    throw new DocumentException(
      DocumentErrorCode.DOCUMENT_VALIDATION_FAILED,
      'Website document must be schemaVersion 2.0 or 3.0',
      HttpStatus.BAD_REQUEST,
    );
  }

  validate(document: unknown): WebsiteDocumentV3 {
    if (!document || typeof document !== 'object') {
      throw new DocumentException(
        DocumentErrorCode.DOCUMENT_VALIDATION_FAILED,
        'Website document must be a non-null object',
        HttpStatus.BAD_REQUEST,
      );
    }

    const prepared = this.prepareTheme(
      coerceV3Document(document) as Record<string, unknown>,
    );
    const parsed = WebsiteDocumentV3Schema.safeParse(prepared);

    if (!parsed.success) {
      throw documentValidationFailed(
        'Website document schema validation failed',
        parsed.error.issues.map((issue: ZodIssue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }

    return this.normalize(parsed.data as WebsiteDocumentV3);
  }

  safeValidate(document: unknown): {
    isValid: boolean;
    errors?: Array<{ path: string; message: string }>;
    data?: WebsiteDocumentV3;
  } {
    try {
      return { isValid: true, data: this.validate(document) };
    } catch (error) {
      if (error instanceof DocumentException) {
        const response = error.getResponse() as Record<string, unknown>;
        return {
          isValid: false,
          errors:
            (response.errors as Array<{ path: string; message: string }>) ||
            [{ path: '', message: error.message }],
        };
      }
      return {
        isValid: false,
        errors: [{ path: '', message: error instanceof Error ? error.message : 'Invalid document' }],
      };
    }
  }

  normalize(doc: WebsiteDocumentV3): WebsiteDocumentV3 {
    this.assertDocumentSize(doc);

    const seenIds = new Set<string>();
    const pages = doc.pages.map((page, pageIndex) => {
      const pageId = page.id;
      this.claimId(seenIds, pageId, `pages[${pageIndex}].id`);

      if (page.root.type !== 'page-root') {
        throw new DocumentException(
          DocumentErrorCode.INVALID_NODE,
          `Page "${pageId}" root must be type page-root`,
          HttpStatus.BAD_REQUEST,
          { path: `pages[${pageIndex}].root.type` },
        );
      }

      const root = this.normalizeNode(
        page.root,
        seenIds,
        `pages[${pageIndex}].root`,
        0,
        null,
      );

      const name = page.name || page.title;
      const title = page.title || page.name;
      const sections = this.projectLegacySections(root);

      return {
        ...page,
        id: pageId,
        name,
        title,
        sortOrder: typeof page.sortOrder === 'number' ? page.sortOrder : pageIndex,
        enabled: page.enabled !== false,
        root,
        sections,
      } as PageContractV3;
    });

    pages.sort((a, b) => a.sortOrder - b.sortOrder);

    const theme = this.normalizeTheme(doc.theme);
    const settings = doc.settings || {
      enableContactForm: true,
      language: 'en',
    };

    return {
      ...doc,
      schemaVersion: '3.0',
      site: {
        ...doc.site,
        settings: doc.site.settings || settings,
      },
      theme,
      settings,
      pages,
    };
  }

  validateForPersistence(document: unknown) {
    if (this.isV3(document)) {
      return this.validate(document);
    }

    const version = (document as { schemaVersion?: string } | null)?.schemaVersion;
    if (version === '2.0') {
      return this.v2Validator.validateV2(document);
    }

    return this.migrationService.migrateWebsiteDocument(document);
  }

  private normalizeNode(
    node: VisualNode,
    seenIds: Set<string>,
    path: string,
    depth: number,
    parentType: VisualNode['type'] | null,
  ): VisualNode {
    if (depth > DOCUMENT_LIMITS.maxDepth) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_NODE,
        `Document exceeds maximum nesting depth of ${DOCUMENT_LIMITS.maxDepth}`,
        HttpStatus.BAD_REQUEST,
        { path },
      );
    }

    if (!node?.id) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_NODE,
        `Node at ${path} is missing a stable id`,
        HttpStatus.BAD_REQUEST,
        { path },
      );
    }

    if (!isNodeType(node.type)) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_NODE,
        `Unknown node type "${node.type}"`,
        HttpStatus.BAD_REQUEST,
        { path: `${path}.type` },
      );
    }

    this.claimId(seenIds, node.id, `${path}.id`);

    if (parentType && !canNest(parentType, node.type)) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_PARENT,
        `Node type "${node.type}" cannot be nested inside "${parentType}"`,
        HttpStatus.BAD_REQUEST,
        { path },
      );
    }

    const children = node.children || [];
    if (isLeafNode(node.type) && children.length > 0) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_NODE,
        `Node type "${node.type}" cannot contain children`,
        HttpStatus.BAD_REQUEST,
        { path: `${path}.children` },
      );
    }

    const props = this.normalizeProps(node.type, {
      ...(NODE_REGISTRY[node.type].defaultProps || {}),
      ...(node.props || {}),
    }, `${path}.props`);
    this.assertSafeStyles(node.styles || {}, `${path}.styles`);
    Object.entries(node.responsive || {}).forEach(([breakpoint, styles]) => {
      this.assertSafeStyles(styles || {}, `${path}.responsive.${breakpoint}`);
    });

    const styles = pruneEmptyStyles(node.styles || {});
    const responsive = pruneResponsiveOverrides(styles, node.responsive || {});

    return {
      ...node,
      props,
      styles,
      responsive,
      enabled: node.enabled !== false,
      children: children.map((child, index) =>
        this.normalizeNode(
          child,
          seenIds,
          `${path}.children[${index}]`,
          depth + 1,
          node.type,
        ),
      ),
    };
  }

  private normalizeProps(
    type: VisualNode['type'],
    props: Record<string, unknown>,
    path: string,
  ): Record<string, unknown> {
    const sanitized = sanitizeUnknown(props, path) as Record<string, unknown>;

    if (type === 'heading' || type === 'paragraph' || type === 'text') {
      if (sanitized.text !== undefined && typeof sanitized.text !== 'string') {
        throw new DocumentException(
          DocumentErrorCode.INVALID_NODE,
          `${type} props.text must be a string`,
          HttpStatus.BAD_REQUEST,
          { path: `${path}.text` },
        );
      }
      if (typeof sanitized.text === 'string' && sanitized.text.length > DOCUMENT_LIMITS.maxPropString) {
        throw new DocumentException(
          DocumentErrorCode.INVALID_NODE,
          `${type} text exceeds maximum length`,
          HttpStatus.BAD_REQUEST,
          { path: `${path}.text` },
        );
      }
    }

    if (type === 'heading' && sanitized.tag !== undefined) {
      const tag = String(sanitized.tag);
      if (!['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        throw new DocumentException(
          DocumentErrorCode.INVALID_NODE,
          'heading props.tag must be h1-h6',
          HttpStatus.BAD_REQUEST,
          { path: `${path}.tag` },
        );
      }
    }

    if (type === 'image') {
      if (sanitized.mediaId !== undefined && typeof sanitized.mediaId !== 'string') {
        throw new DocumentException(
          DocumentErrorCode.INVALID_NODE,
          'image props.mediaId must be a string',
          HttpStatus.BAD_REQUEST,
          { path: `${path}.mediaId` },
        );
      }
      if (typeof sanitized.mediaId === 'string' && sanitized.mediaId.includes('://')) {
        throw new DocumentException(
          DocumentErrorCode.INVALID_NODE,
          'image mediaId cannot be a URL; use props.src for remote images',
          HttpStatus.BAD_REQUEST,
          { path: `${path}.mediaId` },
        );
      }
    }

    if (type === 'legacy-section') {
      const legacyType = String(sanitized.legacyType || '');
      if (!isValidSectionType(legacyType)) {
        throw new DocumentException(
          DocumentErrorCode.INVALID_NODE,
          `Unknown legacy section type "${legacyType}"`,
          HttpStatus.BAD_REQUEST,
          { path: `${path}.legacyType` },
        );
      }
      const variant = String(sanitized.variant || SECTION_REGISTRY[legacyType].defaultVariant);
      if (!isValidVariant(legacyType, variant)) {
        throw new DocumentException(
          DocumentErrorCode.INVALID_NODE,
          `Invalid variant "${variant}" for legacy section "${legacyType}"`,
          HttpStatus.BAD_REQUEST,
          { path: `${path}.variant` },
        );
      }
      sanitized.variant = variant;
    }

    return sanitized;
  }

  private projectLegacySections(root: VisualNode): PageContractV3['sections'] {
    return root.children
      .filter((child) => child.type === 'legacy-section')
      .map((child, index) => ({
        id: child.id,
        type: String(child.props.legacyType) as never,
        variant: String(child.props.variant || 'standard'),
        enabled: child.enabled !== false,
        sortOrder: index,
        props: (child.props.payload as Record<string, unknown>) || {},
        styles: child.styles as Record<string, unknown>,
        responsive: child.responsive as Record<string, unknown>,
      }));
  }

  private claimId(seenIds: Set<string>, id: string, path: string): void {
    if (seenIds.has(id)) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_NODE,
        `Duplicate node id "${id}"`,
        HttpStatus.BAD_REQUEST,
        { path },
      );
    }
    seenIds.add(id);
  }

  private assertDocumentSize(doc: WebsiteDocumentV3): void {
    const serialized = JSON.stringify(doc);
    if (serialized.length > DOCUMENT_LIMITS.maxBytes) {
      throw new DocumentException(
        DocumentErrorCode.DOCUMENT_TOO_LARGE,
        'Website document exceeds the maximum allowed size',
        HttpStatus.BAD_REQUEST,
      );
    }

    let nodeCount = 0;
    let deepest = 0;
    for (const page of doc.pages) {
      nodeCount += countNodes(page.root);
      deepest = Math.max(deepest, maxDepth(page.root));
    }

    if (nodeCount > DOCUMENT_LIMITS.maxNodes) {
      throw new DocumentException(
        DocumentErrorCode.DOCUMENT_TOO_LARGE,
        `Website document exceeds the maximum of ${DOCUMENT_LIMITS.maxNodes} nodes`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (deepest > DOCUMENT_LIMITS.maxDepth) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_NODE,
        `Document exceeds maximum nesting depth of ${DOCUMENT_LIMITS.maxDepth}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertSafeStyles(styles: StyleModel, path: string): void {
    walkStyleStrings(styles, (value, keyPath) => {
      assertSafeCssValue(value, `${path}.${keyPath}`);
    });
  }

  private prepareTheme(document: Record<string, unknown>): Record<string, unknown> {
    const theme = { ...((document.theme as Record<string, unknown>) || {}) };
    const colors = (theme.colors as Record<string, string>) || {};
    if (!theme.primaryColor && colors.primary) theme.primaryColor = colors.primary;
    if (!theme.secondaryColor && colors.secondary) theme.secondaryColor = colors.secondary;
    if (!theme.accentColor && colors.accent) theme.accentColor = colors.accent;
    if (!theme.backgroundColor && colors.background) theme.backgroundColor = colors.background;
    if (!theme.textColor && colors.text) theme.textColor = colors.text;

    const typography = (theme.typography as Record<string, string>) || {};
    if (!theme.headingFont && typography.headingFont) theme.headingFont = typography.headingFont;
    if (!theme.bodyFont && typography.bodyFont) theme.bodyFont = typography.bodyFont;

    return { ...document, theme };
  }

  private normalizeTheme(theme: ThemeConfigV3): ThemeConfigV3 {
    const colors = {
      primary: theme.colors?.primary || theme.primaryColor,
      secondary: theme.colors?.secondary || theme.secondaryColor,
      accent: theme.colors?.accent || theme.accentColor,
      background: theme.colors?.background || theme.backgroundColor || '#FFFFFF',
      surface: theme.colors?.surface || '#F8FAFC',
      text: theme.colors?.text || theme.textColor,
      muted: theme.colors?.muted || '#6B7280',
      border: theme.colors?.border || '#E5E7EB',
    };

    const typography = {
      headingFont: theme.typography?.headingFont || theme.headingFont,
      bodyFont: theme.typography?.bodyFont || theme.bodyFont,
    };

    return {
      ...theme,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      accentColor: colors.accent,
      backgroundColor: colors.background,
      textColor: colors.text,
      headingFont: typography.headingFont,
      bodyFont: typography.bodyFont,
      colors,
      typography,
      tokens: theme.tokens || {},
    };
  }
}

function walkStyleStrings(
  value: unknown,
  visit: (value: string, path: string) => void,
  path = '',
): void {
  if (typeof value === 'string') {
    visit(value, path);
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.entries(value).forEach(([key, nested]) => {
    walkStyleStrings(nested, visit, path ? `${path}.${key}` : key);
  });
}
