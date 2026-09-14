import {
  CONTENT_NODE_TYPES,
  NODE_TYPES,
  NodeType,
  StyleModel,
} from '../types/v3.types';

export const NODE_CAPABILITIES = [
  'text',
  'link',
  'typography',
  'color',
  'layout',
  'size',
  'spacing',
  'alignment',
  'visibility',
  'background',
  'border',
  'radius',
  'shadow',
  'media',
] as const;

export type NodeCapability = (typeof NODE_CAPABILITIES)[number];

export interface EditableField {
  key: string;
  label: string;
  kind: 'text' | 'textarea' | 'url' | 'enum' | 'number' | 'media' | 'boolean';
  options?: string[];
}

export interface NodeDefinition {
  type: NodeType;
  name: string;
  displayName: string;
  category: 'structure' | 'content' | 'compat';
  allowedChildren: readonly NodeType[];
  leaf: boolean;
  capabilities: readonly NodeCapability[];
  defaultProps: Record<string, unknown>;
  defaultStyles: StyleModel;
  editableFields: EditableField[];
}

const CONTENT: NodeType[] = [...CONTENT_NODE_TYPES];
const LAYOUT_CHILDREN: NodeType[] = [
  'container',
  'row',
  'column',
  'grid',
  'stack',
  ...CONTENT,
];

const STRUCTURE_CAPS: NodeCapability[] = [
  'layout',
  'size',
  'spacing',
  'alignment',
  'visibility',
  'background',
  'border',
  'shadow',
];

export const NODE_REGISTRY: Record<NodeType, NodeDefinition> = {
  'page-root': {
    type: 'page-root',
    name: 'Page Root',
    displayName: 'Page Root',
    category: 'structure',
    allowedChildren: ['section', 'legacy-section'],
    leaf: false,
    capabilities: ['layout', 'background', 'visibility'],
    defaultProps: {},
    defaultStyles: {},
    editableFields: [],
  },
  section: {
    type: 'section',
    name: 'Section',
    displayName: 'Section',
    category: 'structure',
    allowedChildren: ['container', 'row', 'grid', 'stack'],
    leaf: false,
    capabilities: STRUCTURE_CAPS,
    defaultProps: { name: 'Section' },
    defaultStyles: {
      spacing: { padding: { top: 64, bottom: 64 } },
    },
    editableFields: [{ key: 'name', label: 'Name', kind: 'text' }],
  },
  container: {
    type: 'container',
    name: 'Container',
    displayName: 'Container',
    category: 'structure',
    allowedChildren: LAYOUT_CHILDREN,
    leaf: false,
    capabilities: STRUCTURE_CAPS,
    defaultProps: { maxWidth: '1200px' },
    defaultStyles: {
      size: { width: '100%', maxWidth: '1200px' },
      layout: { display: 'flex', direction: 'column', gap: 24 },
    },
    editableFields: [{ key: 'maxWidth', label: 'Max width', kind: 'text' }],
  },
  row: {
    type: 'row',
    name: 'Row',
    displayName: 'Row',
    category: 'structure',
    allowedChildren: ['column'],
    leaf: false,
    capabilities: STRUCTURE_CAPS,
    defaultProps: {},
    defaultStyles: {
      layout: {
        display: 'flex',
        direction: 'row',
        gap: 24,
        alignItems: 'stretch',
      },
    },
    editableFields: [],
  },
  column: {
    type: 'column',
    name: 'Column',
    displayName: 'Column',
    category: 'structure',
    allowedChildren: LAYOUT_CHILDREN.filter((t) => t !== 'column'),
    leaf: false,
    capabilities: [...STRUCTURE_CAPS, 'size'],
    defaultProps: { span: 6 },
    defaultStyles: { size: { width: '100%' } },
    editableFields: [{ key: 'span', label: 'Span', kind: 'number' }],
  },
  grid: {
    type: 'grid',
    name: 'Grid',
    displayName: 'Grid',
    category: 'structure',
    allowedChildren: ['container', 'stack', 'column', ...CONTENT],
    leaf: false,
    capabilities: STRUCTURE_CAPS,
    defaultProps: { columns: 3 },
    defaultStyles: { layout: { display: 'grid', columns: 3, gap: 24 } },
    editableFields: [{ key: 'columns', label: 'Columns', kind: 'number' }],
  },
  stack: {
    type: 'stack',
    name: 'Stack',
    displayName: 'Stack',
    category: 'structure',
    allowedChildren: LAYOUT_CHILDREN,
    leaf: false,
    capabilities: STRUCTURE_CAPS,
    defaultProps: {},
    defaultStyles: { layout: { display: 'flex', direction: 'column', gap: 16 } },
    editableFields: [],
  },
  heading: {
    type: 'heading',
    name: 'Heading',
    displayName: 'Heading',
    category: 'content',
    allowedChildren: [],
    leaf: true,
    capabilities: ['text', 'typography', 'color', 'spacing', 'alignment', 'visibility'],
    defaultProps: { text: 'Heading', tag: 'h2' },
    defaultStyles: { typography: { fontSize: 36, fontWeight: 600, lineHeight: 1.2 } },
    editableFields: [
      { key: 'text', label: 'Text', kind: 'textarea' },
      { key: 'tag', label: 'Tag', kind: 'enum', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
    ],
  },
  paragraph: {
    type: 'paragraph',
    name: 'Paragraph',
    displayName: 'Paragraph',
    category: 'content',
    allowedChildren: [],
    leaf: true,
    capabilities: ['text', 'typography', 'color', 'spacing', 'alignment', 'visibility'],
    defaultProps: { text: 'Add your copy here.' },
    defaultStyles: { typography: { fontSize: 16, lineHeight: 1.6 } },
    editableFields: [{ key: 'text', label: 'Text', kind: 'textarea' }],
  },
  text: {
    type: 'text',
    name: 'Text',
    displayName: 'Text',
    category: 'content',
    allowedChildren: [],
    leaf: true,
    capabilities: ['text', 'typography', 'color', 'spacing', 'alignment', 'visibility'],
    defaultProps: { text: 'Text' },
    defaultStyles: {},
    editableFields: [{ key: 'text', label: 'Text', kind: 'text' }],
  },
  button: {
    type: 'button',
    name: 'Button',
    displayName: 'Button',
    category: 'content',
    allowedChildren: [],
    leaf: true,
    capabilities: [
      'text',
      'link',
      'typography',
      'color',
      'background',
      'border',
      'radius',
      'spacing',
      'visibility',
    ],
    defaultProps: { label: 'Get Started', href: '#', variant: 'primary' },
    defaultStyles: {
      spacing: { padding: { top: 12, bottom: 12, left: 20, right: 20 } },
      background: { color: 'primary' },
      color: { color: '#FFFFFF' },
      radius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
    },
    editableFields: [
      { key: 'label', label: 'Label', kind: 'text' },
      { key: 'href', label: 'Link', kind: 'url' },
      { key: 'variant', label: 'Variant', kind: 'enum', options: ['primary', 'secondary', 'ghost'] },
    ],
  },
  link: {
    type: 'link',
    name: 'Link',
    displayName: 'Link',
    category: 'content',
    allowedChildren: [],
    leaf: true,
    capabilities: ['text', 'link', 'typography', 'color', 'spacing', 'visibility'],
    defaultProps: { label: 'Learn more', href: '#' },
    defaultStyles: { color: { color: 'primary' } },
    editableFields: [
      { key: 'label', label: 'Label', kind: 'text' },
      { key: 'href', label: 'Link', kind: 'url' },
      { key: 'target', label: 'Target', kind: 'enum', options: ['_self', '_blank'] },
    ],
  },
  image: {
    type: 'image',
    name: 'Image',
    displayName: 'Image',
    category: 'content',
    allowedChildren: [],
    leaf: true,
    capabilities: ['media', 'size', 'spacing', 'border', 'radius', 'visibility'],
    defaultProps: { alt: '', fit: 'cover', position: 'center' },
    defaultStyles: { size: { width: '100%', height: 'auto' } },
    editableFields: [
      { key: 'mediaId', label: 'Media', kind: 'media' },
      { key: 'alt', label: 'Alt text', kind: 'text' },
      { key: 'fit', label: 'Fit', kind: 'enum', options: ['cover', 'contain', 'fill', 'none'] },
      { key: 'position', label: 'Position', kind: 'text' },
    ],
  },
  divider: {
    type: 'divider',
    name: 'Divider',
    displayName: 'Divider',
    category: 'content',
    allowedChildren: [],
    leaf: true,
    capabilities: ['color', 'spacing', 'size', 'visibility'],
    defaultProps: { style: 'solid' },
    defaultStyles: { size: { width: '100%', height: 1 }, color: { color: 'border' } },
    editableFields: [
      { key: 'style', label: 'Style', kind: 'enum', options: ['solid', 'dashed', 'dotted'] },
    ],
  },
  spacer: {
    type: 'spacer',
    name: 'Spacer',
    displayName: 'Spacer',
    category: 'content',
    allowedChildren: [],
    leaf: true,
    capabilities: ['size', 'visibility'],
    defaultProps: { height: 32 },
    defaultStyles: { size: { height: 32 } },
    editableFields: [{ key: 'height', label: 'Height', kind: 'number' }],
  },
  'legacy-section': {
    type: 'legacy-section',
    name: 'Legacy Section',
    displayName: 'Legacy Section',
    category: 'compat',
    allowedChildren: [],
    leaf: true,
    capabilities: ['visibility'],
    defaultProps: {},
    defaultStyles: {},
    editableFields: [],
  },
};

export const ALLOWED_PARENTS: Record<NodeType, NodeType[]> = Object.fromEntries(
  NODE_TYPES.map((type) => [type, [] as NodeType[]]),
) as Record<NodeType, NodeType[]>;

for (const parent of NODE_TYPES) {
  for (const child of NODE_REGISTRY[parent].allowedChildren) {
    ALLOWED_PARENTS[child].push(parent);
  }
}

export function isNodeType(type: string): type is NodeType {
  return (NODE_TYPES as readonly string[]).includes(type);
}

export function canNest(parentType: NodeType, childType: NodeType): boolean {
  return NODE_REGISTRY[parentType].allowedChildren.includes(childType);
}

export function isLeafNode(type: NodeType): boolean {
  return NODE_REGISTRY[type].leaf;
}

export function getComponentMetadata(type: NodeType) {
  const definition = NODE_REGISTRY[type];
  return {
    type: definition.type,
    name: definition.name,
    allowedParents: ALLOWED_PARENTS[type],
    allowedChildren: [...definition.allowedChildren],
    defaultProps: definition.defaultProps,
    defaultStyles: definition.defaultStyles,
    editableFields: definition.editableFields,
    capabilities: [...definition.capabilities],
    category: definition.category,
    leaf: definition.leaf,
  };
}

export function getComponentCatalog() {
  return NODE_TYPES.map((type) => getComponentMetadata(type));
}
