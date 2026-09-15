import { BadRequestException } from '@nestjs/common';
import {
  ComponentState,
  COMPONENT_STATES,
  NavItem,
  WebsiteDocumentV3,
  WebsiteNode,
} from '../types/document.types';
import { isValidComponentVariant } from '../contracts/component-registry';
import { normalizeFormFields } from '../contracts/form-fields';
import { isSafeUrl } from '../security/document-security';

export function walkNodes(node: WebsiteNode, visit: (node: WebsiteNode) => void): void {
  visit(node);
  if (node.children) {
    for (const child of node.children) {
      walkNodes(child, visit);
    }
  }
}

export function walkDocumentNodes(
  doc: WebsiteDocumentV3,
  visit: (node: WebsiteNode, scope: string) => void,
): void {
  for (const page of doc.pages || []) {
    if (page.root) {
      walkNodes(page.root, (node) => visit(node, `pages.${page.id}`));
    }
  }

  const global = doc.global;
  if (global?.headerNode) {
    walkNodes(global.headerNode, (node) => visit(node, 'global.headerNode'));
  }
  if (global?.footerNode) {
    walkNodes(global.footerNode, (node) => visit(node, 'global.footerNode'));
  }
  if (global?.reusableNodes) {
    for (const [componentId, node] of Object.entries(global.reusableNodes)) {
      walkNodes(node, (child) => visit(child, `global.reusableNodes.${componentId}`));
    }
  }
}

export function collectDocumentNodeIds(doc: WebsiteDocumentV3): Set<string> {
  const ids = new Set<string>();
  walkDocumentNodes(doc, (node) => {
    if (node.id) ids.add(node.id);
  });
  return ids;
}

export function collectSubtreeIds(node: WebsiteNode): string[] {
  const ids: string[] = [];
  walkNodes(node, (child) => {
    if (child.id) ids.push(child.id);
  });
  return ids;
}

export function collectMediaIds(doc: WebsiteDocumentV3): string[] {
  const ids = new Set<string>();
  walkDocumentNodes(doc, (node) => {
    const propId = node.props?.mediaId;
    if (typeof propId === 'string' && propId.trim()) {
      ids.add(propId.trim());
    }
    const styleId = node.styles?.background?.mediaId;
    if (typeof styleId === 'string' && styleId.trim()) {
      ids.add(styleId.trim());
    }
    const responsive = node.responsive;
    if (responsive) {
      for (const bp of [responsive.desktop, responsive.tablet, responsive.mobile]) {
        const mediaId = bp?.background?.mediaId;
        if (typeof mediaId === 'string' && mediaId.trim()) {
          ids.add(mediaId.trim());
        }
      }
    }
  });
  return [...ids];
}

export function assertUniqueNodeIds(doc: WebsiteDocumentV3): void {
  const seen = new Map<string, string>();
  walkDocumentNodes(doc, (node, scope) => {
    if (!node.id) return;
    const existing = seen.get(node.id);
    if (existing) {
      throw new BadRequestException({
        code: 'DUPLICATE_NODE_ID',
        message: `Duplicate node id "${node.id}" found in ${scope} (also used in ${existing})`,
        errors: [{ path: `${scope}.${node.id}`, message: 'Node IDs must be unique across the document' }],
      });
    }
    seen.set(node.id, scope);
  });
}

export function assertUniquePageSlugs(doc: WebsiteDocumentV3): void {
  const seen = new Map<string, string>();
  for (const page of doc.pages || []) {
    const slug = page.slug;
    if (!slug) continue;
    const existing = seen.get(slug);
    if (existing) {
      throw new BadRequestException({
        code: 'DUPLICATE_PAGE_SLUG',
        message: `Page slug "${slug}" is used by both "${existing}" and "${page.id}"`,
        errors: [{ path: `pages.${page.id}.slug`, message: 'Page slugs must be unique per website' }],
      });
    }
    seen.set(slug, page.id);
  }
}

export function normalizeHomepage(doc: WebsiteDocumentV3): void {
  if (!doc.pages?.length) return;

  const marked = doc.pages.filter((page) => page.isHomepage);
  if (marked.length === 1) {
    for (const page of doc.pages) {
      page.isHomepage = page.id === marked[0].id;
    }
    return;
  }

  const homeType = doc.pages.find((page) => page.type === 'home') || doc.pages.find((page) => page.slug === '/');
  const chosen = marked[0] || homeType || doc.pages[0];
  for (const page of doc.pages) {
    page.isHomepage = page.id === chosen.id;
  }
}

export function assertValidNavigation(doc: WebsiteDocumentV3): void {
  const pageIds = new Set((doc.pages || []).map((page) => page.id));

  const walk = (navItems: NavItem[], path: string) => {
    for (const item of navItems) {
      const itemPath = `${path}.${item.id}`;
      if (item.kind === 'page' || item.pageId) {
        if (!item.pageId || !pageIds.has(item.pageId)) {
          throw new BadRequestException({
            code: 'INVALID_NAVIGATION',
            message: `Navigation item "${item.label}" references missing page "${item.pageId || ''}"`,
            errors: [{ path: `${itemPath}.pageId`, message: 'Internal page reference does not exist' }],
          });
        }
      }
      if (item.href && !isSafeUrl(item.href)) {
        throw new BadRequestException({
          code: 'INVALID_NAVIGATION',
          message: `Navigation item "${item.label}" has an unsafe URL`,
          errors: [{ path: `${itemPath}.href`, message: 'Unsafe or invalid URL' }],
        });
      }
      if (item.children?.length) {
        walk(item.children as NavItem[], itemPath);
      }
    }
  };

  walk(doc.navigation?.header || [], 'navigation.header');

  for (const column of doc.navigation?.footer || []) {
    for (const link of column.links || []) {
      if (link.href && !isSafeUrl(link.href)) {
        throw new BadRequestException({
          code: 'INVALID_NAVIGATION',
          message: `Footer link "${link.label}" has an unsafe URL`,
          errors: [{ path: `navigation.footer.${column.title}.${link.id}.href`, message: 'Unsafe or invalid URL' }],
        });
      }
    }
  }
}

export function assertReusableIntegrity(doc: WebsiteDocumentV3): void {
  const defs = doc.global?.reusableNodes || {};

  const collectRefs = (node: WebsiteNode, refs: string[]) => {
    if (node.componentRef) refs.push(node.componentRef);
    if (node.children) {
      for (const child of node.children) collectRefs(child, refs);
    }
  };

  for (const [componentId, node] of Object.entries(defs)) {
    const visited = new Set<string>([componentId]);
    const walk = (defId: string) => {
      const def = defs[defId];
      if (!def) {
        throw new BadRequestException({
          code: 'INVALID_COMPONENT_REF',
          message: `Reusable component "${defId}" is referenced but not defined`,
          errors: [{ path: `global.reusableNodes.${defId}`, message: 'Missing reusable component' }],
        });
      }
      const refs: string[] = [];
      collectRefs(def, refs);
      for (const ref of refs) {
        if (visited.has(ref)) {
          throw new BadRequestException({
            code: 'CIRCULAR_COMPONENT_REF',
            message: `Circular reusable component reference involving "${componentId}"`,
            errors: [{ path: `global.reusableNodes.${componentId}.componentRef`, message: 'Circular reusable reference' }],
          });
        }
        visited.add(ref);
        walk(ref);
      }
    };
    walk(componentId);
  }

  walkDocumentNodes(doc, (node, scope) => {
    if (!node.componentRef) return;
    if (!defs[node.componentRef]) {
      throw new BadRequestException({
        code: 'INVALID_COMPONENT_REF',
        message: `Node "${node.id}" references unknown reusable component "${node.componentRef}"`,
        errors: [{ path: `${scope}.${node.id}.componentRef`, message: 'Unknown reusable component' }],
      });
    }
  });
}

export function assertVariantsAndStates(doc: WebsiteDocumentV3): void {
  const allowedStates = new Set<string>(COMPONENT_STATES);
  walkDocumentNodes(doc, (node, scope) => {
    const variant = node.variant;
    if (variant && !isValidComponentVariant(node.type, variant)) {
      throw new BadRequestException({
        code: 'INVALID_VARIANT',
        message: `Component "${node.type}" does not support variant "${variant}"`,
        errors: [{ path: `${scope}.${node.id}.variant`, message: 'Variant is not registered for this component' }],
      });
    }
    if (node.states) {
      for (const key of Object.keys(node.states)) {
        if (!allowedStates.has(key)) {
          throw new BadRequestException({
            code: 'INVALID_STATE',
            message: `Unsupported component state "${key}" on node "${node.id}"`,
            errors: [{ path: `${scope}.${node.id}.states.${key}`, message: 'Only hover, active, focus, and disabled states are allowed' }],
          });
        }
      }
    }
  });
}

export function assertMediaReferences(doc: WebsiteDocumentV3): void {
  walkDocumentNodes(doc, (node, scope) => {
    const mediaId = node.props?.mediaId;
    if (typeof mediaId === 'string' && mediaId.includes('://')) {
      throw new BadRequestException({
        code: 'INVALID_MEDIA_REF',
        message: `Node "${node.id}" mediaId cannot be a URL`,
        errors: [{ path: `${scope}.${node.id}.props.mediaId`, message: 'Use a tenant media asset id, not a URL' }],
      });
    }
    if (typeof node.props?.href === 'string' && node.props.href && !isSafeUrl(node.props.href)) {
      throw new BadRequestException({
        code: 'UNSAFE_URL',
        message: `Node "${node.id}" has an unsafe href`,
        errors: [{ path: `${scope}.${node.id}.props.href`, message: 'Unsafe or invalid URL' }],
      });
    }
    const src = node.props?.src;
    if (typeof src === 'string' && src && !isSafeUrl(src)) {
      throw new BadRequestException({
        code: 'UNSAFE_URL',
        message: `Node "${node.id}" has an unsafe src`,
        errors: [{ path: `${scope}.${node.id}.props.src`, message: 'Unsafe or invalid URL' }],
      });
    }
    const objectFit = node.props?.objectFit ?? node.props?.fit;
    if (
      typeof objectFit === 'string' &&
      !['cover', 'contain', 'fill', 'none', 'scale-down'].includes(objectFit)
    ) {
      throw new BadRequestException({
        code: 'INVALID_NODE',
        message: `Node "${node.id}" has an invalid object-fit value`,
        errors: [{ path: `${scope}.${node.id}.props.objectFit`, message: 'Invalid object-fit' }],
      });
    }
  });
}

export function assertFormFields(doc: WebsiteDocumentV3): void {
  walkDocumentNodes(doc, (node, scope) => {
    if (node.type !== 'form' && node.type !== 'contact-form') return;
    const action = node.props?.action;
    if (action !== undefined && action !== 'leads' && typeof action !== 'string') {
      throw new BadRequestException({
        code: 'INVALID_FORM',
        message: `Form "${node.id}" has an invalid action`,
        errors: [{ path: `${scope}.${node.id}.props.action`, message: 'Form action must be leads' }],
      });
    }
    if (typeof action === 'string' && action !== 'leads' && !isSafeUrl(action)) {
      throw new BadRequestException({
        code: 'INVALID_FORM',
        message: `Form "${node.id}" has an unsafe action`,
        errors: [{ path: `${scope}.${node.id}.props.action`, message: 'Unsafe form action' }],
      });
    }
    try {
      node.props = {
        ...(node.props || {}),
        fields: normalizeFormFields(node.props?.fields),
        action: typeof action === 'string' && action ? action : 'leads',
        submissionConfig: {
          action: 'leads',
          source:
            (node.props?.submissionConfig as { source?: string } | undefined)?.source ||
            'contact_form',
        },
      };
    } catch (error: any) {
      throw new BadRequestException({
        code: 'INVALID_FORM',
        message: `Form "${node.id}" has invalid fields: ${error.message}`,
        errors: [{ path: `${scope}.${node.id}.props.fields`, message: error.message }],
      });
    }
  });
}

export function collectDocumentFormFields(doc: WebsiteDocumentV3) {
  const forms: ReturnType<typeof normalizeFormFields>[] = [];
  walkDocumentNodes(doc, (node) => {
    if (node.type === 'form' || node.type === 'contact-form') {
      forms.push(normalizeFormFields(node.props?.fields));
    }
  });
  return forms;
}

export function stripPrototypePollution(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) stripPrototypePollution(item);
    return;
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      delete record[key];
      continue;
    }
    stripPrototypePollution(record[key]);
  }
}

export function isAllowedState(value: string): value is ComponentState {
  return (COMPONENT_STATES as readonly string[]).includes(value);
}

export function assertCmsBindings(doc: WebsiteDocumentV3): void {
  for (const page of doc.pages || []) {
    if (
      (page.kind === 'collection-index' || page.kind === 'collection-item') &&
      !page.collection?.slug
    ) {
      throw new BadRequestException({
        code: 'INVALID_COLLECTION_PAGE',
        message: `Page "${page.id}" is dynamic but has no collection slug`,
        errors: [{ path: `pages.${page.id}.collection`, message: 'collection.slug is required' }],
      });
    }
  }

  walkDocumentNodes(doc, (node, scope) => {
    const binding = node.binding;
    if (!binding) return;
    if (
      (binding.source === 'collection' || binding.source === 'record') &&
      !binding.collection
    ) {
      throw new BadRequestException({
        code: 'INVALID_BINDING',
        message: `Node "${node.id}" binding is missing a collection slug`,
        errors: [{ path: `${scope}.${node.id}.binding.collection`, message: 'collection is required' }],
      });
    }
    if (binding.fallback && !isSafeUrl(binding.fallback) && /javascript:|<script/i.test(binding.fallback)) {
      throw new BadRequestException({
        code: 'INVALID_BINDING',
        message: `Node "${node.id}" binding fallback is unsafe`,
        errors: [{ path: `${scope}.${node.id}.binding.fallback`, message: 'Unsafe fallback' }],
      });
    }
  });
}
