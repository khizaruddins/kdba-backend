import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  WebsiteDocumentV3,
  WebsiteNode,
  DocumentOperation,
  PageDocumentV3,
  ComponentStateKey,
  AnimationDefinition,
  SectionType,
  StyleDefinition,
} from '../types/document.types';
import { isAllowedChild, isLeafNode } from '../contracts/component-registry';
import { createSectionVariantStructure } from '../contracts/section-registry';

export interface NodeSearchResult {
  node: WebsiteNode;
  parent: WebsiteNode | null;
  index: number;
}

@Injectable()
export class TreeOperationsService {
  /**
   * Apply a batch of operations transactionally in memory.
   * If any operation fails, an exception is thrown and the document is not modified.
   */
  applyOperations(
    initialDoc: WebsiteDocumentV3,
    operations: DocumentOperation[],
  ): WebsiteDocumentV3 {
    if (!operations || operations.length === 0) {
      return initialDoc;
    }

    // Work on a deep clone to guarantee transactionality
    const doc: WebsiteDocumentV3 = JSON.parse(JSON.stringify(initialDoc));

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      try {
        this.applySingleOperation(doc, op);
      } catch (err: any) {
        throw new BadRequestException({
          message: `Operation ${i} (${op.type}) failed: ${err.message}`,
          failedOperationIndex: i,
          operation: op,
        });
      }
    }

    return doc;
  }

  private applySingleOperation(doc: WebsiteDocumentV3, op: DocumentOperation): void {
    switch (op.type) {
      case 'addNode':
        this.addNode(doc, op.pageId, op.parentId, op.node, op.index);
        break;

      case 'removeNode':
        this.removeNode(doc, op.pageId, op.nodeId);
        break;

      case 'duplicateNode':
        this.duplicateNode(doc, op.pageId, op.nodeId, op.targetParentId, op.index);
        break;

      case 'moveNode':
        this.moveNode(doc, op.pageId, op.nodeId, op.targetParentId, op.targetIndex);
        break;

      case 'updateNode':
        this.updateNode(doc, op.pageId, op.nodeId, op.patch);
        break;

      case 'updateProps':
        this.updateProps(doc, op.pageId, op.nodeId, op.props);
        break;

      case 'updateStyles':
        this.updateStyles(doc, op.pageId, op.nodeId, op.styles);
        break;

      case 'updateResponsive':
        this.updateResponsive(doc, op.pageId, op.nodeId, op.responsive);
        break;

      case 'updateState':
        this.updateState(doc, op.pageId, op.nodeId, op.state, op.styles);
        break;

      case 'updateAnimation':
        this.updateAnimation(doc, op.pageId, op.nodeId, op.animation);
        break;

      case 'resetResponsive':
        this.resetResponsive(doc, op.pageId, op.nodeId, op.breakpoint, op.propertyPaths);
        break;

      case 'setNodeLabel':
        this.setNodeLabel(doc, op.pageId, op.nodeId, op.label);
        break;

      case 'setLock':
        this.setLock(doc, op.pageId, op.nodeId, op.locked);
        break;

      case 'pasteNode':
        this.pasteNode(doc, op.pageId, op.targetParentId, op.node, op.index);
        break;

      case 'changeLayout':
        this.changeLayout(doc, op.pageId, op.nodeId, op.layoutType, op.options);
        break;

      case 'replaceSection':
        this.replaceSection(
          doc,
          op.pageId,
          op.sectionId,
          op.targetVariant,
          op.targetSectionType,
          op.preserveContent,
        );
        break;

      case 'setVisibility':
        this.setVisibility(doc, op.pageId, op.nodeId, op.visibility);
        break;

      case 'changeParent':
        this.changeParent(doc, op.pageId, op.nodeId, op.newParentId, op.index);
        break;

      case 'reorderChildren':
        this.reorderChildren(doc, op.pageId, op.parentId, op.childIds);
        break;

      case 'addPage':
        this.addPage(doc, op.page);
        break;

      case 'updatePage':
        this.updatePage(doc, op.pageId, op.patch);
        break;

      case 'removePage':
        this.removePage(doc, op.pageId);
        break;

      case 'reorderPages':
        this.reorderPages(doc, op.pageIds);
        break;

      case 'updateTheme':
        doc.theme = { ...doc.theme, ...(op.theme as any) };
        break;

      case 'updateBusiness':
        doc.business = { ...doc.business, ...(op.business as any) };
        break;

      case 'updateNavigation':
        doc.navigation = { ...doc.navigation, ...(op.navigation as any) };
        break;

      case 'updateSeo':
        doc.seo = { ...doc.seo, ...(op.seo as any) };
        break;

      case 'updateSettings':
        doc.settings = { ...doc.settings, ...(op.settings as any) };
        break;

      default:
        throw new BadRequestException(`Unsupported operation type: ${(op as any).type}`);
    }
  }

  // ─── PAGE OPERATIONS ────────────────────────────────────────────────────────

  addPage(doc: WebsiteDocumentV3, page: PageDocumentV3): void {
    if (doc.pages.some((p) => p.id === page.id)) {
      throw new BadRequestException(`Page with id "${page.id}" already exists`);
    }
    if (doc.pages.some((p) => p.slug === page.slug)) {
      throw new BadRequestException(`Page with slug "${page.slug}" already exists`);
    }

    if (!page.root || page.root.type !== 'page-root') {
      page.root = {
        id: `root_${page.id}`,
        type: 'page-root',
        name: 'Page Root',
        children: [],
        props: {},
        styles: { layout: { display: 'flex', width: '100%', minHeight: '100vh' } },
      };
    }

    doc.pages.push(page);
    doc.pages.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  updatePage(doc: WebsiteDocumentV3, pageId: string, patch: Partial<PageDocumentV3>): void {
    const page = this.findPage(doc, pageId);
    if (patch.title !== undefined) page.title = patch.title;
    if (patch.slug !== undefined) {
      if (doc.pages.some((p) => p.id !== pageId && p.slug === patch.slug)) {
        throw new BadRequestException(`Slug "${patch.slug}" is already in use by another page`);
      }
      page.slug = patch.slug;
    }
    if (patch.type !== undefined) page.type = patch.type;
    if (patch.sortOrder !== undefined) page.sortOrder = patch.sortOrder;
    if (patch.enabled !== undefined) page.enabled = patch.enabled;
    if (patch.seo !== undefined) page.seo = { ...page.seo, ...patch.seo };
    doc.pages.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  removePage(doc: WebsiteDocumentV3, pageId: string): void {
    if (doc.pages.length <= 1) {
      throw new BadRequestException('Cannot delete the only remaining page of a website');
    }
    const idx = doc.pages.findIndex((p) => p.id === pageId);
    if (idx === -1) {
      throw new NotFoundException(`Page with id "${pageId}" not found`);
    }
    doc.pages.splice(idx, 1);
  }

  reorderPages(doc: WebsiteDocumentV3, pageIds: string[]): void {
    const pageMap = new Map(doc.pages.map((p) => [p.id, p]));
    const reordered: PageDocumentV3[] = [];

    pageIds.forEach((id, sortOrder) => {
      const page = pageMap.get(id);
      if (page) {
        page.sortOrder = sortOrder;
        reordered.push(page);
        pageMap.delete(id);
      }
    });

    // Append any pages not explicitly specified
    pageMap.forEach((remainingPage) => {
      remainingPage.sortOrder = reordered.length;
      reordered.push(remainingPage);
    });

    doc.pages = reordered;
  }

  // ─── NODE TREE OPERATIONS ───────────────────────────────────────────────────

  addNode(
    doc: WebsiteDocumentV3,
    pageId: string,
    parentId: string,
    node: WebsiteNode,
    index?: number,
  ): void {
    const page = this.findPage(doc, pageId);
    const parent = this.ensureNodeUnlocked(page, parentId);

    if (isLeafNode(parent.type)) {
      throw new BadRequestException(`Node "${parent.type}" is a leaf and cannot accept children`);
    }

    if (!isAllowedChild(parent.type, node.type)) {
      throw new BadRequestException(
        `Node of type "${node.type}" is not allowed as a child of "${parent.type}"`,
      );
    }

    if (!parent.children) {
      parent.children = [];
    }

    // Ensure node has a stable unique ID
    if (!node.id || this.findNode(page.root, node.id)) {
      node.id = `${node.type.replace(/-/g, '_')}_${crypto.randomBytes(4).toString('hex')}`;
    }

    if (typeof index === 'number' && index >= 0 && index <= parent.children.length) {
      parent.children.splice(index, 0, node);
    } else {
      parent.children.push(node);
    }
  }

  removeNode(doc: WebsiteDocumentV3, pageId: string, nodeId: string): void {
    const page = this.findPage(doc, pageId);

    if (page.root.id === nodeId) {
      throw new BadRequestException('Cannot delete the root node of a page');
    }

    this.ensureNodeUnlocked(page, nodeId);

    const search = this.findNodeAndParent(page.root, nodeId);
    if (!search || !search.parent || !search.parent.children) {
      throw new NotFoundException(`Node "${nodeId}" not found in page "${pageId}"`);
    }

    search.parent.children.splice(search.index, 1);
  }

  duplicateNode(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    targetParentId?: string,
    index?: number,
  ): WebsiteNode {
    const page = this.findPage(doc, pageId);
    this.ensureNodeUnlocked(page, nodeId);

    const search = this.findNodeAndParent(page.root, nodeId);
    if (!search) {
      throw new NotFoundException(`Node "${nodeId}" not found in page "${pageId}"`);
    }

    if (search.node.type === 'page-root') {
      throw new BadRequestException('Cannot duplicate the page root node');
    }

    const destParentId = targetParentId || (search.parent ? search.parent.id : page.root.id);
    const destParent = this.ensureNodeUnlocked(page, destParentId);

    if (!isAllowedChild(destParent.type, search.node.type)) {
      throw new BadRequestException(
        `Node "${search.node.type}" cannot be duplicated into target parent "${destParent.type}"`,
      );
    }

    // Deep clone and assign fresh IDs to the cloned subtree
    const cloned = this.cloneSubtreeWithNewIds(search.node);

    if (!destParent.children) {
      destParent.children = [];
    }

    const insertionIndex =
      typeof index === 'number' && index >= 0 && index <= destParent.children.length
        ? index
        : destParent.id === search.parent?.id
          ? search.index + 1
          : destParent.children.length;

    destParent.children.splice(insertionIndex, 0, cloned);
    return cloned;
  }

  moveNode(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    targetParentId: string,
    targetIndex: number,
  ): void {
    const page = this.findPage(doc, pageId);

    if (nodeId === page.root.id) {
      throw new BadRequestException('Cannot move the page root node');
    }

    this.ensureNodeUnlocked(page, nodeId);
    const targetParent = this.ensureNodeUnlocked(page, targetParentId);

    const search = this.findNodeAndParent(page.root, nodeId);
    if (!search || !search.parent || !search.parent.children) {
      throw new NotFoundException(`Node "${nodeId}" not found in page "${pageId}"`);
    }

    if (isLeafNode(targetParent.type)) {
      throw new BadRequestException(`Target parent "${targetParent.type}" cannot have children`);
    }

    if (!isAllowedChild(targetParent.type, search.node.type)) {
      throw new BadRequestException(
        `Cannot move node of type "${search.node.type}" into "${targetParent.type}"`,
      );
    }

    // Circular reference prevention: targetParent cannot be the node itself or a descendant
    if (nodeId === targetParentId || this.isDescendant(search.node, targetParentId)) {
      throw new BadRequestException(
        `Circular move detected: cannot move node "${nodeId}" into itself or one of its descendants`,
      );
    }

    // Remove from current parent
    search.parent.children.splice(search.index, 1);

    if (!targetParent.children) {
      targetParent.children = [];
    }

    const safeIndex = Math.max(0, Math.min(targetIndex, targetParent.children.length));
    targetParent.children.splice(safeIndex, 0, search.node);
  }

  updateNode(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    patch: Partial<WebsiteNode>,
  ): void {
    const page = this.findPage(doc, pageId);
    const node = this.ensureNodeUnlocked(page, nodeId);

    if (patch.name !== undefined) node.name = patch.name;
    if (patch.props !== undefined) node.props = { ...node.props, ...patch.props };
    if (patch.styles !== undefined) node.styles = { ...node.styles, ...patch.styles };
    if (patch.responsive !== undefined) node.responsive = { ...node.responsive, ...patch.responsive };
    if (patch.states !== undefined) node.states = { ...node.states, ...patch.states };
    if (patch.visibility !== undefined) node.visibility = { ...node.visibility, ...patch.visibility };
    if (patch.interactions !== undefined) node.interactions = patch.interactions;
    if (patch.animations !== undefined) node.animations = patch.animations;
    if (patch.locked !== undefined) node.locked = patch.locked;
  }

  updateProps(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    props: Record<string, unknown>,
  ): void {
    const page = this.findPage(doc, pageId);
    const node = this.ensureNodeUnlocked(page, nodeId);
    node.props = { ...node.props, ...props };
  }

  updateStyles(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    styles: Partial<WebsiteNode['styles']>,
  ): void {
    const page = this.findPage(doc, pageId);
    const node = this.ensureNodeUnlocked(page, nodeId);

    node.styles = {
      ...node.styles,
      ...styles,
      layout: { ...node.styles?.layout, ...styles?.layout },
      flex: { ...node.styles?.flex, ...styles?.flex },
      grid: { ...node.styles?.grid, ...styles?.grid },
      size: { ...node.styles?.size, ...styles?.size },
      spacing: { ...node.styles?.spacing, ...styles?.spacing },
      typography: { ...node.styles?.typography, ...styles?.typography },
      background: { ...node.styles?.background, ...styles?.background },
      border: { ...node.styles?.border, ...styles?.border },
      effects: { ...node.styles?.effects, ...styles?.effects },
      transform: { ...node.styles?.transform, ...styles?.transform },
    };
  }

  updateResponsive(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    responsive: Partial<WebsiteNode['responsive']>,
  ): void {
    const page = this.findPage(doc, pageId);
    const node = this.ensureNodeUnlocked(page, nodeId);

    node.responsive = {
      ...node.responsive,
      ...responsive,
    };
  }

  updateState(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    state: ComponentStateKey,
    styles: Partial<StyleDefinition> | null,
  ): void {
    const page = this.findPage(doc, pageId);
    const node = this.ensureNodeUnlocked(page, nodeId);

    if (!node.states) {
      node.states = {};
    }

    if (styles === null || styles === undefined) {
      delete node.states[state];
      if (Object.keys(node.states).length === 0) {
        delete node.states;
      }
      return;
    }

    const currentState = node.states[state] || {};
    node.states[state] = {
      ...currentState,
      ...styles,
      layout: { ...currentState.layout, ...styles.layout },
      flex: { ...currentState.flex, ...styles.flex },
      grid: { ...currentState.grid, ...styles.grid },
      size: { ...currentState.size, ...styles.size },
      spacing: { ...currentState.spacing, ...styles.spacing },
      typography: { ...currentState.typography, ...styles.typography },
      background: { ...currentState.background, ...styles.background },
      border: { ...currentState.border, ...styles.border },
      effects: { ...currentState.effects, ...styles.effects },
      transform: { ...currentState.transform, ...styles.transform },
    };
  }

  updateAnimation(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    animation: Partial<AnimationDefinition> | null,
  ): void {
    const page = this.findPage(doc, pageId);
    const node = this.ensureNodeUnlocked(page, nodeId);

    if (
      animation === null ||
      animation === undefined ||
      animation.preset === 'none' ||
      animation.type === 'none'
    ) {
      delete node.animations;
      return;
    }

    node.animations = {
      ...node.animations,
      ...animation,
    };
  }

  resetResponsive(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    breakpoint: string,
    propertyPaths?: string[],
  ): void {
    const page = this.findPage(doc, pageId);
    const node = this.ensureNodeUnlocked(page, nodeId);

    if (!node.responsive) {
      return;
    }

    const bpStyles =
      breakpoint === 'tablet'
        ? node.responsive.tablet
        : breakpoint === 'mobile'
          ? node.responsive.mobile
          : node.responsive.custom?.[breakpoint];

    if (!bpStyles) {
      return;
    }

    if (!propertyPaths || propertyPaths.length === 0) {
      // Clear entire breakpoint override
      if (breakpoint === 'tablet') {
        delete node.responsive.tablet;
      } else if (breakpoint === 'mobile') {
        delete node.responsive.mobile;
      } else if (node.responsive.custom) {
        delete node.responsive.custom[breakpoint];
      }
      return;
    }

    // Reset specific property paths e.g. "typography.fontSize", "size.width"
    for (const path of propertyPaths) {
      const parts = path.split('.');
      let current: any = bpStyles;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current) break;
        current = current[parts[i]];
      }
      if (current && parts.length > 0) {
        delete current[parts[parts.length - 1]];
      }
    }
  }

  setNodeLabel(doc: WebsiteDocumentV3, pageId: string, nodeId: string, label: string): void {
    const page = this.findPage(doc, pageId);
    const node = this.ensureNodeUnlocked(page, nodeId);
    node.name = label.trim();
  }

  setLock(doc: WebsiteDocumentV3, pageId: string, nodeId: string, locked: boolean): void {
    const page = this.findPage(doc, pageId);
    const node = this.findNode(page.root, nodeId);
    if (!node) {
      throw new NotFoundException(`Node "${nodeId}" not found in page "${pageId}"`);
    }
    node.locked = locked;
  }

  pasteNode(
    doc: WebsiteDocumentV3,
    pageId: string,
    targetParentId: string,
    node: WebsiteNode,
    index?: number,
  ): WebsiteNode {
    const page = this.findPage(doc, pageId);
    const targetParent = this.ensureNodeUnlocked(page, targetParentId);

    if (isLeafNode(targetParent.type)) {
      throw new BadRequestException(`Target parent "${targetParent.type}" cannot accept children`);
    }

    if (!isAllowedChild(targetParent.type, node.type)) {
      throw new BadRequestException(
        `Node of type "${node.type}" is not allowed inside parent "${targetParent.type}"`,
      );
    }

    // Clone subtree with brand new IDs, preserving all styles, responsive, states, animations, props
    const cloned = this.cloneSubtreeWithNewIds(node);

    if (!targetParent.children) {
      targetParent.children = [];
    }

    const safeIndex =
      typeof index === 'number' && index >= 0 && index <= targetParent.children.length
        ? index
        : targetParent.children.length;

    targetParent.children.splice(safeIndex, 0, cloned);
    return cloned;
  }

  changeLayout(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    layoutType: string,
    options?: {
      columns?: number;
      gap?: string;
      direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
      wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
      alignItems?: string;
      justifyContent?: string;
      preserveContent?: boolean;
    },
  ): void {
    const page = this.findPage(doc, pageId);
    const node = this.ensureNodeUnlocked(page, nodeId);

    if (isLeafNode(node.type)) {
      throw new BadRequestException(`Cannot change layout on leaf node "${node.type}"`);
    }

    if (!node.styles) {
      node.styles = {};
    }

    switch (layoutType) {
      case 'grid': {
        const columns = options?.columns || 3;
        const gap = options?.gap || '24px';
        node.styles.layout = { ...node.styles.layout, display: 'grid' };
        node.styles.grid = {
          ...node.styles.grid,
          columns,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          columnGap: gap,
          rowGap: gap,
        };
        if (node.type === 'stack' || node.type === 'row') {
          node.type = 'grid';
        }
        break;
      }

      case 'stack': {
        const direction = options?.direction || 'column';
        const gap = options?.gap || '16px';
        node.styles.layout = { ...node.styles.layout, display: 'flex' };
        node.styles.flex = {
          ...node.styles.flex,
          direction,
          gap,
          alignItems: (options?.alignItems as any) || (direction === 'column' ? 'flex-start' : 'center'),
          justifyContent: (options?.justifyContent as any) || 'flex-start',
          wrap: options?.wrap || (direction === 'row' ? 'wrap' : 'nowrap'),
        };
        if (node.type === 'grid' || node.type === 'row') {
          node.type = 'stack';
        }
        break;
      }

      case 'row': {
        const gap = options?.gap || '24px';
        node.styles.layout = { ...node.styles.layout, display: 'flex' };
        node.styles.flex = {
          ...node.styles.flex,
          direction: 'row',
          gap,
          wrap: options?.wrap || 'wrap',
          alignItems: (options?.alignItems as any) || 'center',
          justifyContent: (options?.justifyContent as any) || 'flex-start',
        };
        if (node.type === 'grid' || node.type === 'stack') {
          node.type = 'row';
        }
        break;
      }

      case 'column': {
        const gap = options?.gap || '16px';
        node.styles.layout = { ...node.styles.layout, display: 'flex' };
        node.styles.flex = {
          ...node.styles.flex,
          direction: 'column',
          gap,
          alignItems: (options?.alignItems as any) || 'stretch',
        };
        if (node.type === 'grid' || node.type === 'row') {
          node.type = 'column';
        }
        break;
      }

      default: {
        if (['flex', 'grid', 'block'].includes(layoutType)) {
          node.styles.layout = { ...node.styles.layout, display: layoutType as any };
        }
      }
    }
  }

  replaceSection(
    doc: WebsiteDocumentV3,
    pageId: string,
    sectionId: string,
    targetVariant: string,
    targetSectionType?: SectionType,
    preserveContent: boolean = true,
  ): WebsiteNode {
    const page = this.findPage(doc, pageId);
    const search = this.findNodeAndParent(page.root, sectionId);
    if (!search || !search.parent) {
      throw new NotFoundException(`Section "${sectionId}" not found in page "${pageId}"`);
    }

    if (search.node.locked) {
      throw new BadRequestException(`Section "${sectionId}" is locked and cannot be replaced`);
    }

    const currentSection = search.node;
    const sectionType =
      targetSectionType ||
      (currentSection.props?.sectionType as SectionType) ||
      'features';

    // Extract compatible content from current section if preserveContent is true
    const extractedContent = preserveContent ? this.extractContentFromSubtree(currentSection) : null;

    // Create new section structure based on variant
    const newSection = createSectionVariantStructure(sectionType, targetVariant, sectionId);

    // If preserving content, map extracted elements into corresponding slots
    if (extractedContent) {
      this.hydrateSectionContent(newSection, extractedContent);
    }

    // Preserve original anchorId and custom name
    if (currentSection.props?.anchorId) {
      newSection.props = { ...newSection.props, anchorId: currentSection.props.anchorId };
    }
    if (currentSection.name && !currentSection.name.startsWith('Section')) {
      newSection.name = currentSection.name;
    }

    // Replace in parent's children array
    search.parent.children![search.index] = newSection;
    return newSection;
  }

  extractContentFromSubtree(root: WebsiteNode): {
    headings: Array<{ text: string; level?: number }>;
    paragraphs: Array<{ text: string }>;
    images: Array<{ src: string; alt?: string; mediaId?: string }>;
    buttons: Array<{ label: string; href?: string; variant?: string }>;
    badges: Array<{ text: string }>;
  } {
    const headings: Array<{ text: string; level?: number }> = [];
    const paragraphs: Array<{ text: string }> = [];
    const images: Array<{ src: string; alt?: string; mediaId?: string }> = [];
    const buttons: Array<{ label: string; href?: string; variant?: string }> = [];
    const badges: Array<{ text: string }> = [];

    const walk = (node: WebsiteNode) => {
      if (node.type === 'heading' && node.props?.text) {
        headings.push({ text: String(node.props.text), level: Number(node.props.level) || 2 });
      } else if ((node.type === 'paragraph' || node.type === 'text') && node.props?.text) {
        paragraphs.push({ text: String(node.props.text) });
      } else if (node.type === 'image' && node.props?.src) {
        images.push({
          src: String(node.props.src),
          alt: node.props.alt ? String(node.props.alt) : undefined,
          mediaId: node.props.mediaId ? String(node.props.mediaId) : undefined,
        });
      } else if (node.type === 'button' && (node.props?.label || node.props?.text)) {
        buttons.push({
          label: String(node.props.label || node.props.text),
          href: node.props.href ? String(node.props.href) : undefined,
          variant: node.props.variant ? String(node.props.variant) : undefined,
        });
      } else if (node.type === 'badge' && node.props?.text) {
        badges.push({ text: String(node.props.text) });
      }

      if (node.children) {
        for (const child of node.children) {
          walk(child);
        }
      }
    };

    walk(root);
    return { headings, paragraphs, images, buttons, badges };
  }

  hydrateSectionContent(
    newSection: WebsiteNode,
    content: {
      headings: Array<{ text: string; level?: number }>;
      paragraphs: Array<{ text: string }>;
      images: Array<{ src: string; alt?: string; mediaId?: string }>;
      buttons: Array<{ label: string; href?: string; variant?: string }>;
      badges: Array<{ text: string }>;
    },
  ): void {
    let hIdx = 0;
    let pIdx = 0;
    let imgIdx = 0;
    let btnIdx = 0;
    let badgeIdx = 0;

    const walk = (node: WebsiteNode) => {
      if (node.type === 'heading' && hIdx < content.headings.length) {
        node.props = { ...node.props, text: content.headings[hIdx].text };
        if (content.headings[hIdx].level) {
          node.props.level = content.headings[hIdx].level;
        }
        hIdx++;
      } else if ((node.type === 'paragraph' || node.type === 'text') && pIdx < content.paragraphs.length) {
        node.props = { ...node.props, text: content.paragraphs[pIdx].text };
        pIdx++;
      } else if (node.type === 'image' && imgIdx < content.images.length) {
        node.props = {
          ...node.props,
          src: content.images[imgIdx].src,
          alt: content.images[imgIdx].alt ?? node.props?.alt,
          mediaId: content.images[imgIdx].mediaId ?? node.props?.mediaId,
        };
        imgIdx++;
      } else if (node.type === 'button' && btnIdx < content.buttons.length) {
        node.props = {
          ...node.props,
          label: content.buttons[btnIdx].label,
          href: content.buttons[btnIdx].href ?? node.props?.href,
          variant: content.buttons[btnIdx].variant ?? node.props?.variant,
        };
        btnIdx++;
      } else if (node.type === 'badge' && badgeIdx < content.badges.length) {
        node.props = { ...node.props, text: content.badges[badgeIdx].text };
        badgeIdx++;
      }

      if (node.children) {
        for (const child of node.children) {
          walk(child);
        }
      }
    };

    walk(newSection);
  }

  setVisibility(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    visibility: WebsiteNode['visibility'],
  ): void {
    const page = this.findPage(doc, pageId);
    const node = this.ensureNodeUnlocked(page, nodeId);
    node.visibility = { ...node.visibility, ...visibility };
  }

  changeParent(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    newParentId: string,
    index?: number,
  ): void {
    const page = this.findPage(doc, pageId);
    this.ensureNodeUnlocked(page, nodeId);
    const targetParent = this.ensureNodeUnlocked(page, newParentId);
    const targetIndex =
      typeof index === 'number' ? index : targetParent.children?.length ?? 0;
    this.moveNode(doc, pageId, nodeId, newParentId, targetIndex);
  }

  reorderChildren(
    doc: WebsiteDocumentV3,
    pageId: string,
    parentId: string,
    childIds: string[],
  ): void {
    const page = this.findPage(doc, pageId);
    const parent = this.ensureNodeUnlocked(page, parentId);

    if (!parent.children || parent.children.length === 0) {
      return;
    }

    const childMap = new Map(parent.children.map((c) => [c.id, c]));
    const reordered: WebsiteNode[] = [];

    childIds.forEach((id) => {
      const child = childMap.get(id);
      if (child) {
        reordered.push(child);
        childMap.delete(id);
      }
    });

    // Append any children not listed in childIds
    childMap.forEach((remainingChild) => {
      reordered.push(remainingChild);
    });

    parent.children = reordered;
  }

  // ─── UTILITY TRAVERSAL METHODS ──────────────────────────────────────────────

  findNodeAndAncestors(
    root: WebsiteNode,
    id: string,
    ancestors: WebsiteNode[] = [],
  ): { node: WebsiteNode; ancestors: WebsiteNode[] } | null {
    if (root.id === id) {
      return { node: root, ancestors };
    }
    if (root.children) {
      for (const child of root.children) {
        const found = this.findNodeAndAncestors(child, id, [...ancestors, root]);
        if (found) return found;
      }
    }
    return null;
  }

  ensureNodeUnlocked(page: PageDocumentV3, nodeId: string): WebsiteNode {
    const search = this.findNodeAndAncestors(page.root, nodeId);
    if (!search) {
      throw new NotFoundException(`Node "${nodeId}" not found in page "${page.id}"`);
    }
    const { node, ancestors } = search;
    if (node.locked) {
      throw new BadRequestException(`Node "${nodeId}" is locked and cannot be modified`);
    }
    for (const ancestor of ancestors) {
      if (ancestor.locked) {
        throw new BadRequestException(
          `Node "${nodeId}" cannot be modified because its parent/ancestor "${ancestor.id}" is locked`,
        );
      }
    }
    return node;
  }

  findPage(doc: WebsiteDocumentV3, pageId: string): PageDocumentV3 {
    const page = doc.pages.find((p) => p.id === pageId);
    if (!page) {
      throw new NotFoundException(`Page with id "${pageId}" not found`);
    }
    return page;
  }

  findNode(root: WebsiteNode, id: string): WebsiteNode | null {
    if (root.id === id) return root;
    if (root.children) {
      for (const child of root.children) {
        const found = this.findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  findNodeAndParent(root: WebsiteNode, id: string): NodeSearchResult | null {
    if (root.id === id) {
      return { node: root, parent: null, index: -1 };
    }

    if (root.children) {
      for (let i = 0; i < root.children.length; i++) {
        const child = root.children[i];
        if (child.id === id) {
          return { node: child, parent: root, index: i };
        }
        const found = this.findNodeAndParent(child, id);
        if (found) return found;
      }
    }

    return null;
  }

  isDescendant(ancestor: WebsiteNode, potentialDescendantId: string): boolean {
    if (!ancestor.children) return false;
    for (const child of ancestor.children) {
      if (child.id === potentialDescendantId) return true;
      if (this.isDescendant(child, potentialDescendantId)) return true;
    }
    return false;
  }

  countNodes(root: WebsiteNode): number {
    let count = 1;
    if (root.children) {
      for (const child of root.children) {
        count += this.countNodes(child);
      }
    }
    return count;
  }

  getMaxDepth(root: WebsiteNode, currentDepth = 1): number {
    if (!root.children || root.children.length === 0) {
      return currentDepth;
    }
    let max = currentDepth;
    for (const child of root.children) {
      const d = this.getMaxDepth(child, currentDepth + 1);
      if (d > max) max = d;
    }
    return max;
  }

  cloneSubtreeWithNewIds(node: WebsiteNode): WebsiteNode {
    const suffix = crypto.randomBytes(3).toString('hex');
    const newId = `${node.type.replace(/-/g, '_')}_${Date.now().toString(36)}_${suffix}`;

    const cloned: WebsiteNode = {
      ...JSON.parse(JSON.stringify(node)),
      id: newId,
      name: node.name ? `${node.name} (Copy)` : undefined,
    };

    if (node.children && Array.isArray(node.children)) {
      cloned.children = node.children.map((child) => this.cloneSubtreeWithNewIds(child));
    }

    return cloned;
  }
}
