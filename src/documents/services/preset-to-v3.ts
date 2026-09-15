import { VisualNode } from '../types/v3.types';
import { NodeType, StyleDefinition, WebsiteNode } from '../types/document.types';
import { isValidNodeType } from '../contracts/component-registry';
import * as crypto from 'crypto';

function px(value: string | number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return `${value}px`;
  return String(value);
}

function convertEdges(edges?: { top?: number; right?: number; bottom?: number; left?: number }) {
  if (!edges) return undefined;
  const converted = {
    top: px(edges.top),
    right: px(edges.right),
    bottom: px(edges.bottom),
    left: px(edges.left),
  };
  return Object.values(converted).some(Boolean) ? converted : undefined;
}

export function visualStylesToDefinition(styles: VisualNode['styles'] = {}): StyleDefinition {
  const shadow = styles.shadow;
  return {
    layout: {
      display: styles.layout?.display,
      width: px(styles.size?.width) || (styles.layout?.display ? '100%' : undefined),
      height: px(styles.size?.height),
      minWidth: px(styles.size?.minWidth),
      maxWidth: px(styles.size?.maxWidth),
      minHeight: px(styles.size?.minHeight),
      maxHeight: px(styles.size?.maxHeight),
      columns: styles.layout?.columns,
    },
    flex: {
      direction: styles.layout?.direction,
      wrap: styles.layout?.flexWrap,
      justifyContent: styles.layout?.justifyContent,
      alignItems: styles.layout?.alignItems,
      gap: px(styles.layout?.gap),
      rowGap: px(styles.layout?.rowGap),
      columnGap: px(styles.layout?.columnGap),
    },
    grid: styles.layout?.columns
      ? {
          columns: styles.layout.columns,
          gridTemplateColumns: `repeat(${styles.layout.columns}, minmax(0, 1fr))`,
        }
      : undefined,
    size: {
      width: px(styles.size?.width),
      height: px(styles.size?.height),
      minWidth: px(styles.size?.minWidth),
      maxWidth: px(styles.size?.maxWidth),
      minHeight: px(styles.size?.minHeight),
      maxHeight: px(styles.size?.maxHeight),
    },
    spacing: {
      margin: convertEdges(styles.spacing?.margin),
      padding: convertEdges(styles.spacing?.padding),
    },
    typography: {
      fontFamily: styles.typography?.fontFamily,
      fontSize: px(styles.typography?.fontSize),
      fontWeight: styles.typography?.fontWeight,
      lineHeight: styles.typography?.lineHeight,
      letterSpacing: px(styles.typography?.letterSpacing),
      textAlign: styles.typography?.textAlign || styles.alignment?.textAlign,
      textTransform: styles.typography?.textTransform,
      color: styles.color?.color,
    },
    background: {
      color: styles.background?.color,
      mediaId: styles.background?.mediaId,
      position: styles.background?.position,
    },
    border: {
      width: px(styles.border?.width),
      style: styles.border?.style === 'none' ? 'none' : styles.border?.style,
      color: styles.border?.color,
      radius: styles.radius
        ? {
            topLeft: px(styles.radius.topLeft),
            topRight: px(styles.radius.topRight),
            bottomRight: px(styles.radius.bottomRight),
            bottomLeft: px(styles.radius.bottomLeft),
          }
        : undefined,
    },
    effects: shadow
      ? {
          boxShadow: {
            x: shadow.x ?? 0,
            y: shadow.y ?? 0,
            blur: shadow.blur ?? 0,
            spread: shadow.spread ?? 0,
            color: shadow.color || 'rgba(0,0,0,0.12)',
          },
        }
      : undefined,
  };
}

function mapPresetProps(type: NodeType, props: Record<string, unknown>): Record<string, unknown> {
  const next = { ...props };
  if (type === 'heading' && typeof next.tag === 'string') {
    const match = /^h([1-6])$/i.exec(next.tag);
    if (match) next.level = Number(match[1]);
    delete next.tag;
  }
  if (type === 'image') {
    if (typeof next.fit === 'string' && next.objectFit === undefined) {
      next.objectFit = next.fit;
    }
    if (typeof next.position === 'string' && next.objectPosition === undefined) {
      next.objectPosition = next.position;
    }
  }
  return next;
}

export function visualNodeToWebsiteNode(node: VisualNode): WebsiteNode {
  const type = isValidNodeType(node.type) ? node.type : 'container';
  const props = mapPresetProps(type, node.props || {});
  const converted: WebsiteNode = {
    id: `${type.replace(/-/g, '_')}_${crypto.randomBytes(4).toString('hex')}`,
    type,
    name: typeof props.name === 'string' ? props.name : undefined,
    props,
    styles: visualStylesToDefinition(node.styles),
    children: (node.children || []).map(visualNodeToWebsiteNode),
  };
  if (typeof props.variant === 'string') {
    converted.variant = props.variant;
  }
  if (node.responsive) {
    converted.responsive = {
      desktop: node.responsive.desktop
        ? visualStylesToDefinition(node.responsive.desktop)
        : undefined,
      tablet: node.responsive.tablet
        ? visualStylesToDefinition(node.responsive.tablet)
        : undefined,
      mobile: node.responsive.mobile
        ? visualStylesToDefinition(node.responsive.mobile)
        : undefined,
    };
  }
  return converted;
}
