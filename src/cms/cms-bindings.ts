import { PageDocumentV3, WebsiteDocumentV3, WebsiteNode } from '../documents/types/document.types';
import { walkDocumentNodes } from '../documents/services/document-integrity';
import { NodeBinding } from './cms.types';
import { NodeBindingSchema } from './cms-validation';

export function collectBoundCollectionSlugs(doc: WebsiteDocumentV3): Set<string> {
  const slugs = new Set<string>();
  for (const page of doc.pages || []) {
    if (page.collection?.slug) slugs.add(page.collection.slug);
    if (page.kind === 'collection-index' || page.kind === 'collection-item') {
      if (page.collection?.slug) slugs.add(page.collection.slug);
    }
  }
  walkDocumentNodes(doc, (node) => {
    const binding = parseNodeBinding(node.binding);
    if (binding?.collection) slugs.add(binding.collection);
    const props = node.props || {};
    if (props.cmsList && typeof props.collectionSlug === 'string' && props.collectionSlug) {
      slugs.add(props.collectionSlug);
    }
  });
  return slugs;
}

export function parseNodeBinding(value: unknown): NodeBinding | null {
  if (!value || typeof value !== 'object') return null;
  const result = NodeBindingSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function collectDynamicPages(doc: WebsiteDocumentV3): PageDocumentV3[] {
  return (doc.pages || []).filter(
    (page) => page.kind === 'collection-index' || page.kind === 'collection-item',
  );
}

export function nodeHasBinding(node: WebsiteNode): boolean {
  return Boolean(parseNodeBinding(node.binding));
}
