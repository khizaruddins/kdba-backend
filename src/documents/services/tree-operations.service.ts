import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  WebsiteDocumentV3,
  WebsiteNode,
  DocumentOperation,
  PageDocumentV3,
} from '../types/document.types';
import { isAllowedChild, isLeafNode } from '../contracts/component-registry';

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
    const parent = this.findNode(page.root, parentId);

    if (!parent) {
      throw new NotFoundException(`Parent node "${parentId}" not found in page "${pageId}"`);
    }

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
    const search = this.findNodeAndParent(page.root, nodeId);

    if (!search) {
      throw new NotFoundException(`Node "${nodeId}" not found in page "${pageId}"`);
    }

    if (search.node.type === 'page-root') {
      throw new BadRequestException('Cannot duplicate the page root node');
    }

    const destParentId = targetParentId || (search.parent ? search.parent.id : page.root.id);
    const destParent = this.findNode(page.root, destParentId);

    if (!destParent) {
      throw new NotFoundException(`Target parent node "${destParentId}" not found`);
    }

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

    const search = this.findNodeAndParent(page.root, nodeId);
    if (!search || !search.parent || !search.parent.children) {
      throw new NotFoundException(`Node "${nodeId}" not found in page "${pageId}"`);
    }

    const targetParent = this.findNode(page.root, targetParentId);
    if (!targetParent) {
      throw new NotFoundException(`Target parent node "${targetParentId}" not found`);
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
    const node = this.findNode(page.root, nodeId);
    if (!node) {
      throw new NotFoundException(`Node "${nodeId}" not found in page "${pageId}"`);
    }

    if (patch.name !== undefined) node.name = patch.name;
    if (patch.props !== undefined) node.props = { ...node.props, ...patch.props };
    if (patch.styles !== undefined) node.styles = { ...node.styles, ...patch.styles };
    if (patch.responsive !== undefined) node.responsive = { ...node.responsive, ...patch.responsive };
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
    const node = this.findNode(page.root, nodeId);
    if (!node) {
      throw new NotFoundException(`Node "${nodeId}" not found in page "${pageId}"`);
    }
    node.props = { ...node.props, ...props };
  }

  updateStyles(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    styles: Partial<WebsiteNode['styles']>,
  ): void {
    const page = this.findPage(doc, pageId);
    const node = this.findNode(page.root, nodeId);
    if (!node) {
      throw new NotFoundException(`Node "${nodeId}" not found in page "${pageId}"`);
    }

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
    const node = this.findNode(page.root, nodeId);
    if (!node) {
      throw new NotFoundException(`Node "${nodeId}" not found in page "${pageId}"`);
    }

    node.responsive = {
      ...node.responsive,
      ...responsive,
    };
  }

  setVisibility(
    doc: WebsiteDocumentV3,
    pageId: string,
    nodeId: string,
    visibility: WebsiteNode['visibility'],
  ): void {
    const page = this.findPage(doc, pageId);
    const node = this.findNode(page.root, nodeId);
    if (!node) {
      throw new NotFoundException(`Node "${nodeId}" not found in page "${pageId}"`);
    }

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
    const targetParent = this.findNode(page.root, newParentId);
    if (!targetParent) {
      throw new NotFoundException(`Target parent "${newParentId}" not found`);
    }
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
    const parent = this.findNode(page.root, parentId);

    if (!parent) {
      throw new NotFoundException(`Parent node "${parentId}" not found`);
    }

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
