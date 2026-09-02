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
  WebsiteDocument,
  DocumentMutation,
  SectionContract,
  PageContract,
} from '../types/document.types';

export interface ValidationResult {
  isValid: boolean;
  errors?: Array<{ path: string; message: string }>;
  data?: WebsiteDocument;
}

@Injectable()
export class DocumentValidatorService {
  /**
   * Validate and parse a full WebsiteDocument.
   * Throws BadRequestException on failure or returns parsed/normalized data.
   */
  validate(document: unknown): WebsiteDocument {
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
        message: 'Website document schema validation failed',
        errors: formattedErrors,
      });
    }

    return this.normalize(result.data as WebsiteDocument);
  }

  /**
   * Safe validate without throwing exception (useful for template checking and CI)
   */
  safeValidate(document: unknown): ValidationResult {
    if (!document || typeof document !== 'object') {
      return {
        isValid: false,
        errors: [{ path: '', message: 'Document must be a non-null object' }],
      };
    }

    const result = WebsiteDocumentSchema.safeParse(document);

    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.issues.map((err: ZodIssue) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      };
    }

    return {
      isValid: true,
      data: this.normalize(result.data as WebsiteDocument),
    };
  }

  /**
   * Normalize document structure:
   * - Assign unique IDs to pages and sections if missing
   * - Normalize sort orders sequentially
   * - Ensure all links and text are clean
   */
  normalize(doc: WebsiteDocument): WebsiteDocument {
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

      // Sort sections by sortOrder
      sections.sort((a, b) => a.sortOrder - b.sortOrder);

      return {
        ...page,
        id: pageId,
        sortOrder: typeof page.sortOrder === 'number' ? page.sortOrder : pIdx,
        enabled: page.enabled !== undefined ? page.enabled : true,
        sections,
      };
    });

    // Sort pages by sortOrder
    pages.sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      ...doc,
      schemaVersion: '2.0',
      pages,
    };
  }

  /**
   * Apply a granular mutation to an existing WebsiteDocument and validate the result.
   */
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
            sec.enabled = mutation.payload.enabled !== undefined ? Boolean(mutation.payload.enabled) : !sec.enabled;
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
          throw new BadRequestException('pageId and sectionOrders array required for REORDER_SECTIONS');
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

    // Validate and return resulting document
    return this.validate(doc);
  }
}
