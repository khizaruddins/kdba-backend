import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ZodIssue } from 'zod';
import {
  WebsiteDocumentSchema,
  DocumentMutationSchema,
  ThemeSchema,
  BusinessInfoSchema,
  NavigationSchema,
  GlobalSeoSchema,
  SiteSettingsSchema,
  SectionSchema,
} from '../schemas/document.schema';
import {
  WebsiteDocumentV3Schema,
  DocumentOperationSchema,
  DocumentOperationsPayloadSchema,
} from '../schemas/v3/document-v3.schema';
import {
  WebsiteDocument,
  WebsiteDocumentV3,
  DocumentMutation,
  SectionContract,
  PageContract,
  WebsiteNode,
  PageDocumentV3,
} from '../types/document.types';

export interface ValidationResult<T = WebsiteDocument | WebsiteDocumentV3> {
  isValid: boolean;
  errors?: Array<{ path: string; message: string }>;
  data?: T;
}

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024; // 5 MB
const DEFAULT_MAX_NODES = 2000;
const DEFAULT_MAX_DEPTH = 32;

@Injectable()
export class DocumentValidatorService {
  /**
   * Validate and parse a WebsiteDocument (supports both V3.0 and V2.0).
   */
  validate(document: WebsiteDocumentV3): WebsiteDocumentV3;
  validate(document: WebsiteDocument): WebsiteDocument;
  validate(document: unknown): WebsiteDocument | WebsiteDocumentV3;
  validate(document: unknown): any {
    if (!document || typeof document !== 'object') {
      throw new BadRequestException('Website document must be a non-null object');
    }

    const version = (document as any).schemaVersion;

    if (version === '2.0') {
      return this.validateV2(document);
    }

    if (version === '3.0') {
      return this.validateV3(document);
    }

    // Default to V3 validation if unspecified or newer
    try {
      return this.validateV3(document);
    } catch {
      return this.validateV2(document);
    }
  }

  /**
   * Strictly validate and normalize a V3.0 WebsiteDocument.
   */
  validateV3(document: unknown): WebsiteDocumentV3 {
    this.enforceDocumentLimits(document);

    const result = WebsiteDocumentV3Schema.safeParse(document);

    if (!result.success) {
      const formattedErrors = result.error.issues.map((err: ZodIssue) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      throw new BadRequestException({
        message: 'V3 website document schema validation failed',
        errors: formattedErrors,
      });
    }

    const normalized = this.normalizeV3(result.data as WebsiteDocumentV3);
    this.sanitizeDocumentV3(normalized);
    return normalized;
  }

  /**
   * Strictly validate and normalize a legacy V2.0 WebsiteDocument.
   */
  validateV2(document: unknown): WebsiteDocument {
    if (!document || typeof document !== 'object') {
      throw new BadRequestException('Website document must be a non-null object');
    }

    const result = WebsiteDocumentSchema.safeParse(document);

    if (!result.success) {
      const formattedErrors = result.error.issues.map((err: ZodIssue) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      throw new BadRequestException({
        message: 'V2 website document schema validation failed',
        errors: formattedErrors,
      });
    }

    return this.normalizeV2(result.data as WebsiteDocument);
  }

  /**
   * Safe validate without throwing an exception.
   */
  safeValidate(document: unknown): ValidationResult {
    try {
      const data = this.validate(document);
      return { isValid: true, data };
    } catch (err: any) {
      return {
        isValid: false,
        errors: err?.response?.errors || [{ path: '', message: err.message }],
      };
    }
  }

  /**
   * Compute a deterministic cryptographic SHA-256 hash of the document content.
   */
  computeDocumentHash(document: unknown): string {
    const serialized = JSON.stringify(document);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Normalize V3 document structure:
   * - Assign unique IDs if missing
   * - Sort pages sequentially
   * - Ensure page-root structure
   */
  normalizeV3(doc: WebsiteDocumentV3): WebsiteDocumentV3 {
    const pages: PageDocumentV3[] = (doc.pages || []).map((page, pIdx) => {
      const pageId = page.id || `page_${pIdx + 1}_${crypto.randomBytes(3).toString('hex')}`;

      // Normalize root node
      let root = page.root;
      if (!root || root.type !== 'page-root') {
        root = {
          id: `root_${pageId}`,
          type: 'page-root',
          name: 'Page Root',
          children: root?.children || [],
          props: {},
          styles: { layout: { display: 'flex', width: '100%', minHeight: '100vh' } },
        };
      }

      this.ensureNodeIds(root);

      return {
        ...page,
        id: pageId,
        sortOrder: typeof page.sortOrder === 'number' ? page.sortOrder : pIdx,
        enabled: page.enabled !== undefined ? page.enabled : true,
        root,
      };
    });

    pages.sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      ...doc,
      schemaVersion: '3.0',
      pages,
    };
  }

  /**
   * Normalize legacy V2 document structure.
   */
  normalizeV2(doc: WebsiteDocument): WebsiteDocument {
    const pages: PageContract[] = (doc.pages || []).map((page, pIdx) => {
      const pageId = page.id || `page_${pIdx + 1}_${crypto.randomBytes(3).toString('hex')}`;
      const sections: SectionContract[] = (page.sections || []).map((sec, sIdx) => {
        const secId = sec.id || `sec_${pIdx + 1}_${sIdx + 1}_${crypto.randomBytes(3).toString('hex')}`;
        return {
          ...sec,
          id: secId,
          sortOrder: typeof sec.sortOrder === 'number' ? sec.sortOrder : sIdx,
          enabled: sec.enabled !== undefined ? sec.enabled : true,
          props: sec.props || {},
          styles: sec.styles || {},
        };
      });

      sections.sort((a, b) => a.sortOrder - b.sortOrder);

      return {
        ...page,
        id: pageId,
        sortOrder: typeof page.sortOrder === 'number' ? page.sortOrder : pIdx,
        enabled: page.enabled !== undefined ? page.enabled : true,
        sections,
      };
    });

    pages.sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      ...doc,
      schemaVersion: '2.0',
      pages,
    };
  }

  // ─── LIMIT ENFORCEMENT & SECURITY SANITIZATION ──────────────────────────────

  private enforceDocumentLimits(document: unknown): void {
    const rawJson = JSON.stringify(document);
    if (Buffer.byteLength(rawJson, 'utf8') > MAX_DOCUMENT_BYTES) {
      throw new BadRequestException(
        `Document exceeds maximum payload size of ${MAX_DOCUMENT_BYTES / (1024 * 1024)}MB`,
      );
    }

    const doc = document as WebsiteDocumentV3;
    const maxNodes = doc.settings?.limits?.maxNodes || DEFAULT_MAX_NODES;
    const maxDepth = doc.settings?.limits?.maxDepth || DEFAULT_MAX_DEPTH;

    if (Array.isArray(doc.pages)) {
      let totalNodes = 0;
      for (const page of doc.pages) {
        if (page.root) {
          totalNodes += this.countNodes(page.root);
          const depth = this.calculateMaxDepth(page.root);
          if (depth > maxDepth) {
            throw new BadRequestException(
              `Page "${page.title}" exceeds maximum allowable nesting depth of ${maxDepth} (current: ${depth})`,
            );
          }
        }
      }

      if (totalNodes > maxNodes) {
        throw new BadRequestException(
          `Document exceeds maximum allowable node count of ${maxNodes} (current: ${totalNodes})`,
        );
      }
    }
  }

  private countNodes(node: WebsiteNode): number {
    let count = 1;
    if (node.children) {
      for (const child of node.children) {
        count += this.countNodes(child);
      }
    }
    return count;
  }

  private calculateMaxDepth(node: WebsiteNode, current = 1): number {
    if (!node.children || node.children.length === 0) {
      return current;
    }
    let max = current;
    for (const child of node.children) {
      const d = this.calculateMaxDepth(child, current + 1);
      if (d > max) max = d;
    }
    return max;
  }

  private ensureNodeIds(node: WebsiteNode): void {
    if (!node.id) {
      node.id = `${node.type.replace(/-/g, '_')}_${crypto.randomBytes(4).toString('hex')}`;
    }
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.ensureNodeIds(child);
      }
    }
  }

  private sanitizeDocumentV3(doc: WebsiteDocumentV3): void {
    // Sanitize any dangerous scripts or event handlers in rich-text or text props
    for (const page of doc.pages) {
      this.sanitizeNode(page.root);
    }
  }

  private sanitizeNode(node: WebsiteNode): void {
    if (node.props) {
      for (const [key, value] of Object.entries(node.props)) {
        if (typeof value === 'string') {
          node.props[key] = this.stripDangerousHtml(value);
        }
      }
    }

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.sanitizeNode(child);
      }
    }
  }

  private stripDangerousHtml(input: string): string {
    // Strip <script> tags, onload=, onclick=, javascript: URIs
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
      .replace(/javascript:/gi, '');
  }

  // ─── LEGACY V2 MUTATION SUPPORT ─────────────────────────────────────────────

  applyMutation(
    currentDoc: WebsiteDocument,
    mutationRaw: unknown,
  ): WebsiteDocument {
    const parseResult = DocumentMutationSchema.safeParse(mutationRaw);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Invalid mutation payload structure',
        errors: parseResult.error.issues.map((e: ZodIssue) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const mutation = parseResult.data as DocumentMutation;
    const doc = JSON.parse(JSON.stringify(currentDoc)) as WebsiteDocument;

    switch (mutation.type) {
      case 'UPDATE_THEME': {
        const themeCheck = ThemeSchema.partial().safeParse(mutation.payload);
        if (!themeCheck.success) {
          throw new BadRequestException({
            message: 'Invalid theme update payload',
            errors: themeCheck.error.issues.map((e: ZodIssue) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        doc.theme = { ...doc.theme, ...themeCheck.data };
        break;
      }

      case 'UPDATE_BUSINESS': {
        const businessCheck = BusinessInfoSchema.partial().safeParse(mutation.payload);
        if (!businessCheck.success) {
          throw new BadRequestException({
            message: 'Invalid business update payload',
            errors: businessCheck.error.issues.map((e: ZodIssue) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        doc.business = { ...doc.business, ...businessCheck.data };
        break;
      }

      case 'UPDATE_NAVIGATION': {
        const navCheck = NavigationSchema.partial().safeParse(mutation.payload);
        if (!navCheck.success) {
          throw new BadRequestException({
            message: 'Invalid navigation update payload',
            errors: navCheck.error.issues.map((e: ZodIssue) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        doc.navigation = { ...doc.navigation, ...navCheck.data };
        break;
      }

      case 'UPDATE_SEO': {
        const seoCheck = GlobalSeoSchema.partial().safeParse(mutation.payload);
        if (!seoCheck.success) {
          throw new BadRequestException({
            message: 'Invalid SEO update payload',
            errors: seoCheck.error.issues.map((e: ZodIssue) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        doc.seo = { ...doc.seo, ...seoCheck.data };
        break;
      }

      case 'UPDATE_SETTINGS': {
        const settingsCheck = SiteSettingsSchema.partial().safeParse(mutation.payload);
        if (!settingsCheck.success) {
          throw new BadRequestException({
            message: 'Invalid settings update payload',
            errors: settingsCheck.error.issues.map((e: ZodIssue) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        doc.settings = { ...doc.settings, ...settingsCheck.data };
        break;
      }

      case 'UPDATE_SECTION_PROPS': {
        const { sectionId, props } = mutation.payload as {
          sectionId?: string;
          props?: Record<string, unknown>;
        };
        const targetId = mutation.sectionId || sectionId;
        if (!targetId || !props) {
          throw new BadRequestException('sectionId and props are required for UPDATE_SECTION_PROPS');
        }

        let sectionFound = false;
        for (const page of doc.pages) {
          const sec = page.sections.find((s) => s.id === targetId);
          if (sec) {
            sec.props = { ...sec.props, ...props };
            sectionFound = true;
            break;
          }
        }
        if (!sectionFound) {
          throw new BadRequestException(`Section with id "${targetId}" not found`);
        }
        break;
      }

      case 'UPDATE_SECTION_VARIANT': {
        const { sectionId, variant } = mutation.payload as {
          sectionId?: string;
          variant?: string;
        };
        const targetId = mutation.sectionId || sectionId;
        if (!targetId || !variant) {
          throw new BadRequestException('sectionId and variant are required for UPDATE_SECTION_VARIANT');
        }

        let sectionFound = false;
        for (const page of doc.pages) {
          const sec = page.sections.find((s) => s.id === targetId);
          if (sec) {
            sec.variant = variant;
            sectionFound = true;
            break;
          }
        }
        if (!sectionFound) {
          throw new BadRequestException(`Section with id "${targetId}" not found`);
        }
        break;
      }

      case 'TOGGLE_SECTION': {
        const targetId = mutation.sectionId || (mutation.payload.sectionId as string);
        if (!targetId) {
          throw new BadRequestException('sectionId is required for TOGGLE_SECTION');
        }

        let sectionFound = false;
        for (const page of doc.pages) {
          const sec = page.sections.find((s) => s.id === targetId);
          if (sec) {
            sec.enabled =
              mutation.payload.enabled !== undefined
                ? Boolean(mutation.payload.enabled)
                : !sec.enabled;
            sectionFound = true;
            break;
          }
        }
        if (!sectionFound) {
          throw new BadRequestException(`Section with id "${targetId}" not found`);
        }
        break;
      }

      case 'REORDER_SECTIONS': {
        const pageId = mutation.pageId || (mutation.payload.pageId as string);
        const sectionOrders = mutation.payload.sectionOrders as Array<{
          id: string;
          sortOrder: number;
        }>;

        if (!pageId || !Array.isArray(sectionOrders)) {
          throw new BadRequestException(
            'pageId and sectionOrders array required for REORDER_SECTIONS',
          );
        }

        const page = doc.pages.find((p) => p.id === pageId);
        if (!page) {
          throw new BadRequestException(`Page with id "${pageId}" not found`);
        }

        const orderMap = new Map(sectionOrders.map((item) => [item.id, item.sortOrder]));
        page.sections.forEach((sec) => {
          if (orderMap.has(sec.id)) {
            sec.sortOrder = orderMap.get(sec.id)!;
          }
        });
        page.sections.sort((a, b) => a.sortOrder - b.sortOrder);
        break;
      }

      case 'ADD_SECTION': {
        const pageId = mutation.pageId || (mutation.payload.pageId as string);
        const sectionRaw = mutation.payload.section;
        if (!pageId || !sectionRaw) {
          throw new BadRequestException('pageId and section object required for ADD_SECTION');
        }

        const page = doc.pages.find((p) => p.id === pageId);
        if (!page) {
          throw new BadRequestException(`Page with id "${pageId}" not found`);
        }

        const parsedSec = SectionSchema.safeParse(sectionRaw);
        if (!parsedSec.success) {
          throw new BadRequestException({
            message: 'Invalid section definition for ADD_SECTION',
            errors: parsedSec.error.issues.map((e: ZodIssue) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          });
        }

        const newSection: SectionContract = {
          ...parsedSec.data,
          id: parsedSec.data.id || `sec_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
          sortOrder: parsedSec.data.sortOrder ?? page.sections.length,
          enabled: true,
          props: parsedSec.data.props || {},
          styles: parsedSec.data.styles || {},
        };

        page.sections.push(newSection);
        page.sections.sort((a, b) => a.sortOrder - b.sortOrder);
        break;
      }

      case 'REMOVE_SECTION': {
        const targetId = mutation.sectionId || (mutation.payload.sectionId as string);
        if (!targetId) {
          throw new BadRequestException('sectionId required for REMOVE_SECTION');
        }

        let sectionFound = false;
        for (const page of doc.pages) {
          const idx = page.sections.findIndex((s) => s.id === targetId);
          if (idx !== -1) {
            page.sections.splice(idx, 1);
            sectionFound = true;
            break;
          }
        }
        if (!sectionFound) {
          throw new BadRequestException(`Section with id "${targetId}" not found`);
        }
        break;
      }

      default:
        throw new BadRequestException(`Unsupported mutation type: ${mutation.type}`);
    }

    return this.validateV2(doc);
  }
}
