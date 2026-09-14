import { HttpStatus, Injectable } from '@nestjs/common';
import { DocumentMutation } from '../types/document.types';
import {
  DOCUMENT_LIMITS,
  DOCUMENT_OPERATION_TYPES,
  DocumentOperation,
  NodeType,
  PageContractV3,
  ResponsiveBreakpoint,
  RESPONSIVE_BREAKPOINTS,
  StyleModel,
  VisualNode,
  WebsiteDocumentV3,
} from '../types/v3.types';
import { canNest, isLeafNode, isNodeType, NODE_REGISTRY } from '../contracts/node-registry';
import { isSectionPresetId, buildSectionPreset } from '../presets/section-presets';
import { mergeStyles, pruneResponsiveOverrides } from './responsive';
import {
  DocumentErrorCode,
  DocumentException,
} from '../errors/document.errors';
import { StyleSchema } from '../schemas/v3.schema';
import { sanitizeUnknown, sanitizeStyleModel } from '../security/document-security';
import {
  cloneJson,
  cloneNodeWithNewIds,
  collectNodeIds,
  createNode,
  findNodeInTree,
  isAncestor,
  newNodeId,
} from './document-tree';

export interface LocatedNode {
  node: VisualNode;
  parent: VisualNode | null;
  index: number;
  page: PageContractV3;
}

@Injectable()
export class DocumentOperationEngine {
  applyOperations(
    document: WebsiteDocumentV3,
    operations: unknown[],
  ): WebsiteDocumentV3 {
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_OPERATION,
        'At least one document operation is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (operations.length > DOCUMENT_LIMITS.maxBatchOperations) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_OPERATION,
        `A batch may contain at most ${DOCUMENT_LIMITS.maxBatchOperations} operations`,
        HttpStatus.BAD_REQUEST,
      );
    }

    let next = cloneJson(document);

    operations.forEach((raw, index) => {
      try {
        next = this.applyOperation(next, raw);
      } catch (error) {
        if (error instanceof DocumentException) {
          throw new DocumentException(
            (error.getResponse() as Record<string, unknown>).code as DocumentErrorCode,
            error.message,
            error.getStatus(),
            {
              ...((error.getResponse() as Record<string, unknown>) || {}),
              operationIndex: index,
            },
          );
        }
        throw error;
      }
    });

    return next;
  }

  applyOperation(document: WebsiteDocumentV3, raw: unknown): WebsiteDocumentV3 {
    const operation = this.parseOperation(raw);
    const doc = cloneJson(document);

    switch (operation.type) {
      case 'addNode':
        return this.addNode(doc, operation.parentId, operation.node, operation.index);
      case 'removeNode':
        return this.removeNode(doc, operation.nodeId);
      case 'moveNode':
        return this.moveNode(doc, operation.nodeId, operation.parentId, operation.index);
      case 'duplicateNode':
        return this.duplicateNode(doc, operation.nodeId);
      case 'updateNode':
        return this.updateNode(doc, operation.nodeId, operation.changes);
      case 'updateProps':
        return this.updateProps(doc, operation.nodeId, operation.props);
      case 'updateStyles':
        return this.updateStyles(doc, operation.nodeId, operation.styles);
      case 'updateResponsive':
        return this.updateResponsive(
          doc,
          operation.nodeId,
          operation.breakpoint,
          operation.styles,
        );
      case 'reorderChildren':
        return this.reorderChildren(doc, operation.parentId, operation.childIds);
      case 'updateTheme':
        return this.updateTheme(doc, operation.theme);
      case 'updateSite':
        return this.updateSite(doc, operation.site);
      case 'insertPreset':
        return this.insertPreset(doc, operation.parentId, operation.presetId, operation.index);
      default:
        throw new DocumentException(
          DocumentErrorCode.INVALID_OPERATION,
          'Unsupported document operation',
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  applyLegacyMutation(
    document: WebsiteDocumentV3,
    mutation: DocumentMutation,
  ): WebsiteDocumentV3 {
    const doc = cloneJson(document);

    switch (mutation.type) {
      case 'UPDATE_THEME':
        return this.updateTheme(doc, mutation.payload);
      case 'UPDATE_BUSINESS':
        doc.business = { ...doc.business, ...mutation.payload } as WebsiteDocumentV3['business'];
        return doc;
      case 'UPDATE_NAVIGATION':
        doc.navigation = {
          ...doc.navigation,
          ...mutation.payload,
        } as WebsiteDocumentV3['navigation'];
        return doc;
      case 'UPDATE_SEO':
        doc.seo = { ...doc.seo, ...mutation.payload } as WebsiteDocumentV3['seo'];
        return doc;
      case 'UPDATE_SETTINGS':
        doc.settings = {
          ...doc.settings,
          ...mutation.payload,
        } as WebsiteDocumentV3['settings'];
        return doc;
      case 'UPDATE_SECTION_PROPS': {
        const targetId =
          mutation.sectionId || (mutation.payload.sectionId as string | undefined);
        const props = (mutation.payload.props || mutation.payload) as Record<string, unknown>;
        if (!targetId) {
          throw new DocumentException(
            DocumentErrorCode.INVALID_OPERATION,
            'sectionId is required',
            HttpStatus.BAD_REQUEST,
          );
        }
        const located = this.requireNode(doc, targetId);
        if (located.node.type === 'legacy-section') {
          const payload = {
            ...((located.node.props.payload as Record<string, unknown>) || {}),
            ...props,
          };
          located.node.props = { ...located.node.props, payload };
        } else {
          located.node.props = { ...located.node.props, ...props };
        }
        return doc;
      }
      case 'UPDATE_SECTION_VARIANT': {
        const targetId =
          mutation.sectionId || (mutation.payload.sectionId as string | undefined);
        const variant = mutation.payload.variant as string | undefined;
        if (!targetId || !variant) {
          throw new DocumentException(
            DocumentErrorCode.INVALID_OPERATION,
            'sectionId and variant are required',
            HttpStatus.BAD_REQUEST,
          );
        }
        const located = this.requireNode(doc, targetId);
        located.node.props = { ...located.node.props, variant };
        return doc;
      }
      case 'TOGGLE_SECTION': {
        const targetId =
          mutation.sectionId || (mutation.payload.sectionId as string | undefined);
        if (!targetId) {
          throw new DocumentException(
            DocumentErrorCode.INVALID_OPERATION,
            'sectionId is required',
            HttpStatus.BAD_REQUEST,
          );
        }
        const located = this.requireNode(doc, targetId);
        located.node.enabled =
          mutation.payload.enabled !== undefined
            ? Boolean(mutation.payload.enabled)
            : located.node.enabled === false;
        return doc;
      }
      case 'REORDER_SECTIONS': {
        const pageId = mutation.pageId || (mutation.payload.pageId as string | undefined);
        const sectionOrders = mutation.payload.sectionOrders as
          | Array<{ id: string; sortOrder: number }>
          | undefined;
        if (!pageId || !Array.isArray(sectionOrders)) {
          throw new DocumentException(
            DocumentErrorCode.INVALID_OPERATION,
            'pageId and sectionOrders are required',
            HttpStatus.BAD_REQUEST,
          );
        }
        const page = doc.pages.find((item) => item.id === pageId);
        if (!page) {
          throw new DocumentException(
            DocumentErrorCode.NODE_NOT_FOUND,
            `Page "${pageId}" was not found`,
            HttpStatus.BAD_REQUEST,
          );
        }
        const order = new Map(sectionOrders.map((item) => [item.id, item.sortOrder]));
        page.root.children.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
        return doc;
      }
      case 'ADD_SECTION': {
        const pageId = mutation.pageId || (mutation.payload.pageId as string | undefined);
        const section = mutation.payload.section as Record<string, unknown> | undefined;
        if (!pageId || !section) {
          throw new DocumentException(
            DocumentErrorCode.INVALID_OPERATION,
            'pageId and section are required',
            HttpStatus.BAD_REQUEST,
          );
        }
        const page = doc.pages.find((item) => item.id === pageId);
        if (!page) {
          throw new DocumentException(
            DocumentErrorCode.NODE_NOT_FOUND,
            `Page "${pageId}" was not found`,
            HttpStatus.BAD_REQUEST,
          );
        }
        const node = createNode('legacy-section', {
          legacyType: section.type,
          variant: section.variant,
          payload: section.props || {},
        });
        if (typeof section.id === 'string' && section.id) {
          node.id = section.id;
        }
        page.root.children.push(node);
        return doc;
      }
      case 'REMOVE_SECTION': {
        const targetId =
          mutation.sectionId || (mutation.payload.sectionId as string | undefined);
        if (!targetId) {
          throw new DocumentException(
            DocumentErrorCode.INVALID_OPERATION,
            'sectionId is required',
            HttpStatus.BAD_REQUEST,
          );
        }
        return this.removeNode(doc, targetId);
      }
      default:
        throw new DocumentException(
          DocumentErrorCode.INVALID_OPERATION,
          `Unsupported mutation type: ${mutation.type}`,
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  findNode(document: WebsiteDocumentV3, nodeId: string): LocatedNode | null {
    for (const page of document.pages) {
      const located = findNodeInTree(page.root, nodeId, page.id);
      if (located) {
        return {
          node: located.node,
          parent: located.parent,
          index: located.index,
          page,
        };
      }
    }
    return null;
  }

  private addNode(
    document: WebsiteDocumentV3,
    parentId: string,
    rawNode: Partial<VisualNode> & { type: string },
    index?: number,
  ): WebsiteDocumentV3 {
    const parent = this.requireParent(document, parentId);
    if (!isNodeType(rawNode.type)) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_NODE,
        `Unknown node type "${rawNode.type}"`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (rawNode.type === 'page-root') {
      throw new DocumentException(
        DocumentErrorCode.INVALID_NODE,
        'page-root nodes cannot be added to an existing tree',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!canNest(parent.node.type, rawNode.type)) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_PARENT,
        `Node type "${rawNode.type}" cannot be nested inside "${parent.node.type}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const node = this.normalizeIncomingNode(rawNode);
    const incomingIds = collectNodeIds(node);
    if (new Set(incomingIds).size !== incomingIds.length) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_NODE,
        'Incoming node tree contains duplicate ids',
        HttpStatus.BAD_REQUEST,
      );
    }
    for (const id of incomingIds) {
      this.assertUniqueId(document, id);
    }

    const insertAt = this.clampIndex(index, parent.node.children.length);
    parent.node.children.splice(insertAt, 0, node);
    return document;
  }

  private removeNode(document: WebsiteDocumentV3, nodeId: string): WebsiteDocumentV3 {
    const located = this.requireNode(document, nodeId);
    if (!located.parent || located.node.type === 'page-root') {
      throw new DocumentException(
        DocumentErrorCode.INVALID_OPERATION,
        'The page root cannot be removed',
        HttpStatus.BAD_REQUEST,
      );
    }
    located.parent.children.splice(located.index, 1);
    return document;
  }

  private moveNode(
    document: WebsiteDocumentV3,
    nodeId: string,
    parentId: string,
    index?: number,
  ): WebsiteDocumentV3 {
    const located = this.requireNode(document, nodeId);
    if (!located.parent || located.node.type === 'page-root') {
      throw new DocumentException(
        DocumentErrorCode.INVALID_OPERATION,
        'The page root cannot be moved',
        HttpStatus.BAD_REQUEST,
      );
    }

    const nextParent = this.requireParent(document, parentId);
    if (nodeId === parentId || isAncestor(located.node, parentId)) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_PARENT,
        'Cannot move a node into itself or its descendants',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!canNest(nextParent.node.type, located.node.type)) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_PARENT,
        `Node type "${located.node.type}" cannot be nested inside "${nextParent.node.type}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    located.parent.children.splice(located.index, 1);
    const insertAt = this.clampIndex(index, nextParent.node.children.length);
    nextParent.node.children.splice(insertAt, 0, located.node);
    return document;
  }

  private duplicateNode(document: WebsiteDocumentV3, nodeId: string): WebsiteDocumentV3 {
    const located = this.requireNode(document, nodeId);
    if (!located.parent || located.node.type === 'page-root') {
      throw new DocumentException(
        DocumentErrorCode.INVALID_OPERATION,
        'The page root cannot be duplicated',
        HttpStatus.BAD_REQUEST,
      );
    }
    const duplicate = cloneNodeWithNewIds(located.node);
    located.parent.children.splice(located.index + 1, 0, duplicate);
    return document;
  }

  private updateNode(
    document: WebsiteDocumentV3,
    nodeId: string,
    changes: UpdateNodeOperationChanges,
  ): WebsiteDocumentV3 {
    const located = this.requireNode(document, nodeId);
    if (changes.props) {
      located.node.props = {
        ...located.node.props,
        ...(sanitizeUnknown(changes.props, `${nodeId}.props`) as Record<string, unknown>),
      };
    }
    if (changes.styles) {
      located.node.styles = mergeStyles(
        located.node.styles,
        this.parseStyles(changes.styles),
      );
      located.node.responsive = pruneResponsiveOverrides(
        located.node.styles,
        located.node.responsive,
      );
    }
    if (changes.responsive) {
      located.node.responsive = pruneResponsiveOverrides(
        located.node.styles,
        {
          ...located.node.responsive,
          ...this.parseResponsive(changes.responsive),
        },
      );
    }
    if (changes.enabled !== undefined) {
      located.node.enabled = changes.enabled;
    }
    return document;
  }

  private updateProps(
    document: WebsiteDocumentV3,
    nodeId: string,
    props: Record<string, unknown>,
  ): WebsiteDocumentV3 {
    return this.updateNode(document, nodeId, { props });
  }

  private updateStyles(
    document: WebsiteDocumentV3,
    nodeId: string,
    styles: StyleModel,
  ): WebsiteDocumentV3 {
    return this.updateNode(document, nodeId, { styles });
  }

  private updateResponsive(
    document: WebsiteDocumentV3,
    nodeId: string,
    breakpoint: ResponsiveBreakpoint,
    styles: StyleModel,
  ): WebsiteDocumentV3 {
    if (!RESPONSIVE_BREAKPOINTS.includes(breakpoint)) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_OPERATION,
        `Unknown breakpoint "${breakpoint}"`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const located = this.requireNode(document, nodeId);
    const current = located.node.responsive[breakpoint] || {};
    located.node.responsive = pruneResponsiveOverrides(located.node.styles, {
      ...located.node.responsive,
      [breakpoint]: mergeStyles(current, this.parseStyles(styles)),
    });
    return document;
  }

  private reorderChildren(
    document: WebsiteDocumentV3,
    parentId: string,
    childIds: string[],
  ): WebsiteDocumentV3 {
    const parent = this.requireParent(document, parentId);
    const currentIds = parent.node.children.map((child) => child.id);
    if (currentIds.length !== childIds.length || new Set(childIds).size !== childIds.length) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_OPERATION,
        'childIds must be a permutation of the current children',
        HttpStatus.BAD_REQUEST,
      );
    }
    const missing = childIds.filter((id) => !currentIds.includes(id));
    if (missing.length > 0) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_OPERATION,
        'childIds must be a permutation of the current children',
        HttpStatus.BAD_REQUEST,
      );
    }
    const byId = new Map(parent.node.children.map((child) => [child.id, child]));
    parent.node.children = childIds.map((id) => byId.get(id)!);
    return document;
  }

  private updateTheme(
    document: WebsiteDocumentV3,
    theme: Record<string, unknown>,
  ): WebsiteDocumentV3 {
    const next = { ...document.theme, ...theme } as WebsiteDocumentV3['theme'];
    if (theme.colors && typeof theme.colors === 'object') {
      next.colors = {
        ...document.theme.colors,
        ...(theme.colors as WebsiteDocumentV3['theme']['colors']),
      };
    }
    if (theme.typography && typeof theme.typography === 'object') {
      next.typography = {
        ...document.theme.typography,
        ...(theme.typography as WebsiteDocumentV3['theme']['typography']),
      };
    }
    if (theme.tokens && typeof theme.tokens === 'object') {
      next.tokens = {
        ...document.theme.tokens,
        ...(theme.tokens as Record<string, unknown>),
      };
    }
    document.theme = next;
    return document;
  }

  private updateSite(
    document: WebsiteDocumentV3,
    site: Record<string, unknown>,
  ): WebsiteDocumentV3 {
    document.site = { ...document.site, ...site } as WebsiteDocumentV3['site'];
    if (typeof site.name === 'string' && site.name.trim()) {
      document.site.name = site.name.trim();
    }
    return document;
  }

  private insertPreset(
    document: WebsiteDocumentV3,
    parentId: string,
    presetId: string,
    index?: number,
  ): WebsiteDocumentV3 {
    if (!isSectionPresetId(presetId)) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_OPERATION,
        `Unknown section preset "${presetId}"`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const tree = buildSectionPreset(presetId);
    return this.addNode(document, parentId, tree, index);
  }

  private parseOperation(raw: unknown): DocumentOperation {
    if (!raw || typeof raw !== 'object') {
      throw new DocumentException(
        DocumentErrorCode.INVALID_OPERATION,
        'Operation must be an object',
        HttpStatus.BAD_REQUEST,
      );
    }
    const candidate = raw as Record<string, unknown>;
    if (
      typeof candidate.type !== 'string' ||
      !(DOCUMENT_OPERATION_TYPES as readonly string[]).includes(candidate.type)
    ) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_OPERATION,
        `Unsupported operation type "${String(candidate.type)}"`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return candidate as unknown as DocumentOperation;
  }

  private requireNode(document: WebsiteDocumentV3, nodeId: string): LocatedNode {
    const located = this.findNode(document, nodeId);
    if (!located) {
      throw new DocumentException(
        DocumentErrorCode.NODE_NOT_FOUND,
        `Node "${nodeId}" was not found`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return located;
  }

  private requireParent(document: WebsiteDocumentV3, parentId: string): LocatedNode {
    const page = document.pages.find((item) => item.id === parentId);
    if (page) {
      return {
        node: page.root,
        parent: null,
        index: 0,
        page,
      };
    }
    return this.requireNode(document, parentId);
  }

  private normalizeIncomingNode(
    rawNode: Partial<VisualNode> & { type: string },
  ): VisualNode {
    const type = rawNode.type as NodeType;
    const definition = NODE_REGISTRY[type];
    const node: VisualNode = {
      id: rawNode.id || newNodeId(type),
      type,
      props: {
        ...(definition.defaultProps || {}),
        ...((sanitizeUnknown(rawNode.props || {}, `${rawNode.id || type}.props`) ||
          {}) as Record<string, unknown>),
      },
      styles: mergeStyles(definition.defaultStyles || {}, this.parseStyles(rawNode.styles)),
      responsive: this.parseResponsive(rawNode.responsive),
      children: [],
      enabled: rawNode.enabled !== false,
    };

    if (isLeafNode(type) && (rawNode.children || []).length > 0) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_NODE,
        `Node type "${type}" cannot contain children`,
        HttpStatus.BAD_REQUEST,
      );
    }

    for (const child of rawNode.children || []) {
      if (!isNodeType(child.type)) {
        throw new DocumentException(
          DocumentErrorCode.INVALID_NODE,
          `Unknown node type "${child.type}"`,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!canNest(type, child.type)) {
        throw new DocumentException(
          DocumentErrorCode.INVALID_PARENT,
          `Node type "${child.type}" cannot be nested inside "${type}"`,
          HttpStatus.BAD_REQUEST,
        );
      }
      node.children.push(this.normalizeIncomingNode(child));
    }

    return node;
  }

  private assertUniqueId(document: WebsiteDocumentV3, id: string): void {
    if (document.pages.some((page) => page.id === id)) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_NODE,
        `Node id "${id}" is already used`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (this.findNode(document, id)) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_NODE,
        `Node id "${id}" is already used`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private clampIndex(index: number | undefined, length: number): number {
    if (index === undefined || index > length) return length;
    if (index < 0) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_OPERATION,
        'index cannot be negative',
        HttpStatus.BAD_REQUEST,
      );
    }
    return index;
  }

  private parseStyles(styles: unknown): StyleModel {
    if (!styles) return {};
    const parsed = StyleSchema.safeParse(styles);
    if (!parsed.success) {
      throw new DocumentException(
        DocumentErrorCode.INVALID_NODE,
        'Invalid style payload',
        HttpStatus.BAD_REQUEST,
        {
          errors: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      );
    }
    sanitizeStyleModel(parsed.data as Record<string, unknown>);
    return parsed.data;
  }

  private parseResponsive(
    responsive: unknown,
  ): Partial<Record<ResponsiveBreakpoint, StyleModel>> {
    if (!responsive || typeof responsive !== 'object') return {};
    const output: Partial<Record<ResponsiveBreakpoint, StyleModel>> = {};
    for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
      const value = (responsive as Record<string, unknown>)[breakpoint];
      if (value) {
        output[breakpoint] = this.parseStyles(value);
      }
    }
    return output;
  }
}

type UpdateNodeOperationChanges = {
  props?: Record<string, unknown>;
  styles?: StyleModel;
  responsive?: Partial<Record<ResponsiveBreakpoint, StyleModel>>;
  enabled?: boolean;
};
