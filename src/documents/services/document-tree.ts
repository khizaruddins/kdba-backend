import * as crypto from 'crypto';
import { VisualNode } from '../types/v3.types';
import { NodeType } from '../types/v3.types';

export interface NodeLocation {
  node: VisualNode;
  parent: VisualNode | null;
  index: number;
  pageId: string;
}

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function newNodeId(type: string): string {
  const prefix = type.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'node';
  return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
}

export function walkNodes(
  node: VisualNode,
  visitor: (node: VisualNode, parent: VisualNode | null, depth: number) => void,
  parent: VisualNode | null = null,
  depth = 0,
): void {
  visitor(node, parent, depth);
  for (const child of node.children || []) {
    walkNodes(child, visitor, node, depth + 1);
  }
}

export function collectNodeIds(root: VisualNode): string[] {
  const ids: string[] = [];
  walkNodes(root, (node) => {
    ids.push(node.id);
  });
  return ids;
}

export function countNodes(root: VisualNode): number {
  let count = 0;
  walkNodes(root, () => {
    count += 1;
  });
  return count;
}

export function maxDepth(root: VisualNode): number {
  let deepest = 0;
  walkNodes(root, (_node, _parent, depth) => {
    if (depth > deepest) deepest = depth;
  });
  return deepest;
}

export function findNodeInTree(
  root: VisualNode,
  nodeId: string,
  pageId: string,
): NodeLocation | null {
  let found: NodeLocation | null = null;
  const search = (node: VisualNode, parent: VisualNode | null, index: number) => {
    if (node.id === nodeId) {
      found = { node, parent, index, pageId };
      return;
    }
    (node.children || []).forEach((child, childIndex) => {
      if (!found) search(child, node, childIndex);
    });
  };
  search(root, null, 0);
  return found;
}

export function isAncestor(ancestor: VisualNode, possibleDescendantId: string): boolean {
  if (ancestor.id === possibleDescendantId) return true;
  return (ancestor.children || []).some((child) => isAncestor(child, possibleDescendantId));
}

export function cloneNodeWithNewIds(node: VisualNode): VisualNode {
  const cloned = cloneJson(node);
  const remap = (current: VisualNode) => {
    current.id = newNodeId(current.type);
    current.children = (current.children || []).map((child) => {
      remap(child);
      return child;
    });
  };
  remap(cloned);
  return cloned;
}

export function createNode(
  type: NodeType,
  props: Record<string, unknown> = {},
  children: VisualNode[] = [],
  extras: Partial<VisualNode> = {},
): VisualNode {
  return {
    id: extras.id || newNodeId(type),
    type,
    props: { ...props, ...(extras.props || {}) },
    styles: extras.styles || {},
    responsive: extras.responsive || {},
    children,
    enabled: extras.enabled !== false,
  };
}
