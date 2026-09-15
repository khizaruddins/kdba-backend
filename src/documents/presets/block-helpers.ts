import { getDefaultNode, isLeafNode } from '../contracts/component-registry';
import { NodeType, StyleDefinition, WebsiteNode } from '../types/document.types';

export function mergeStyles(base: StyleDefinition = {}, extra: StyleDefinition = {}): StyleDefinition {
  const merged: StyleDefinition = { ...base, ...extra };
  const keys: Array<keyof StyleDefinition> = [
    'layout',
    'flex',
    'grid',
    'size',
    'spacing',
    'typography',
    'background',
    'border',
    'effects',
    'transform',
  ];
  for (const key of keys) {
    const left = base[key];
    const right = extra[key];
    if (left && right && typeof left === 'object' && typeof right === 'object') {
      (merged as Record<string, unknown>)[key] = { ...left, ...right };
    }
  }
  return merged;
}

export function n(
  type: NodeType,
  props: Record<string, unknown> = {},
  children: WebsiteNode[] = [],
  styles?: StyleDefinition,
  variant?: string,
): WebsiteNode {
  const node = getDefaultNode(type);
  node.props = { ...node.props, ...props };
  if (styles) node.styles = mergeStyles(node.styles, styles);
  if (variant) node.variant = variant;
  if (typeof props.name === 'string') node.name = props.name;
  if (children.length > 0) {
    node.children = children;
  } else if (!isLeafNode(type)) {
    node.children = node.children || [];
  }
  delete node.locked;
  return node;
}

export function heading(text: string, level = 2): WebsiteNode {
  return n('heading', { text, level });
}

export function paragraph(text: string): WebsiteNode {
  return n('paragraph', { text });
}

export function text(value: string): WebsiteNode {
  return n('text', { text: value });
}

export function button(label: string, href = '#contact', variant = 'primary'): WebsiteNode {
  return n('button', { label, href, variant });
}

export function link(label: string, href: string): WebsiteNode {
  return n('link', { label, href });
}

export function image(alt: string, src: string): WebsiteNode {
  return n('image', {
    alt,
    src,
    objectFit: 'cover',
    objectPosition: 'center',
    fit: 'cover',
  });
}

export function icon(iconName: string): WebsiteNode {
  return n('icon', { iconName, size: 28 });
}

export function spacer(size = '24px'): WebsiteNode {
  return n('spacer', { height: size }, [], { size: { height: size } });
}

export function divider(): WebsiteNode {
  return n('divider', { style: 'solid' });
}

export function stack(children: WebsiteNode[], styles?: StyleDefinition): WebsiteNode {
  return n('stack', { direction: 'column', gap: '16px' }, children, styles);
}

export function grid(columns: number, children: WebsiteNode[], variant?: string): WebsiteNode {
  return n(
    'grid',
    { columns, gap: '24px' },
    children,
    {
      layout: { display: 'grid', columns },
      grid: {
        columns,
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        columnGap: '24px',
        rowGap: '24px',
        autoFlow: variant === 'masonry' ? 'dense' : 'row',
      },
    },
    variant,
  );
}

export function row(children: WebsiteNode[]): WebsiteNode {
  return n('row', { gutter: '24px' }, children);
}

export function column(span: number, children: WebsiteNode[]): WebsiteNode {
  return n('column', { span }, children, {
    layout: { width: span >= 12 ? '100%' : undefined },
  });
}

export function card(children: WebsiteNode[], variant = 'default'): WebsiteNode {
  return n('card', {}, children, undefined, variant);
}

export function container(children: WebsiteNode[], maxWidth = '1200px'): WebsiteNode {
  return n('container', { maxWidth }, children);
}

export function section(
  name: string,
  blockId: string,
  children: WebsiteNode[],
  styles?: StyleDefinition,
  extraProps: Record<string, unknown> = {},
): WebsiteNode {
  return n(
    'section',
    { name, blockId, fullWidth: true, ...extraProps },
    [container(children)],
    styles,
  );
}

export const IMG = {
  studio:
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&auto=format&fit=crop&q=80',
  interior:
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&auto=format&fit=crop&q=80',
  work1:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop&q=80',
  work2:
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop&q=80',
  work3:
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=80',
  work4:
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&auto=format&fit=crop&q=80',
  portrait:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
};
