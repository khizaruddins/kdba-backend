import { RichTextBlock, RichTextMark, RichTextSpan } from '../types/document.types';
import { containsDangerousPayload, stripHtml } from '../security/document-security';

const MARKS = new Set(['bold', 'italic', 'underline', 'strike']);
const BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'bullet-list',
  'ordered-list',
  'list-item',
]);

export function emptyRichText(): RichTextBlock[] {
  return [{ type: 'paragraph', children: [{ text: '' }] }];
}

export function sanitizeRichTextBlocks(input: unknown): RichTextBlock[] {
  if (!Array.isArray(input) || input.length === 0) {
    return emptyRichText();
  }
  return input.map((block) => sanitizeBlock(block)).filter(Boolean) as RichTextBlock[];
}

export function htmlToRichText(html: string): RichTextBlock[] {
  if (containsDangerousPayload(html)) {
    return [{ type: 'paragraph', children: [{ text: stripHtml(html) }] }];
  }
  const trimmed = html.trim();
  if (!trimmed) return emptyRichText();

  const heading = trimmed.match(/^<h([1-6])[^>]*>([\s\S]*?)<\/h\1>$/i);
  if (heading) {
    return [
      {
        type: 'heading',
        level: Number(heading[1]) as 1 | 2 | 3 | 4 | 5 | 6,
        children: parseInline(heading[2]),
      },
    ];
  }

  return [{ type: 'paragraph', children: parseInline(trimmed) }];
}

export function coerceRichTextProps(props: Record<string, unknown>): Record<string, unknown> {
  const next = { ...props };
  if (Array.isArray(next.blocks)) {
    next.blocks = sanitizeRichTextBlocks(next.blocks);
    delete next.html;
    return next;
  }
  if (typeof next.html === 'string') {
    next.blocks = htmlToRichText(next.html);
    delete next.html;
    return next;
  }
  if (typeof next.text === 'string') {
    next.blocks = [{ type: 'paragraph', children: [{ text: stripHtml(next.text) }] }];
    return next;
  }
  next.blocks = emptyRichText();
  return next;
}

function sanitizeBlock(value: unknown): RichTextBlock | null {
  if (!value || typeof value !== 'object') return null;
  const block = value as Record<string, unknown>;
  const type = typeof block.type === 'string' && BLOCK_TYPES.has(block.type)
    ? (block.type as RichTextBlock['type'])
    : 'paragraph';

  const children = Array.isArray(block.children)
    ? block.children
        .map((child) => {
          if (child && typeof child === 'object' && 'type' in (child as object)) {
            return sanitizeBlock(child);
          }
          return sanitizeSpan(child);
        })
        .filter(Boolean)
    : [{ text: '' }];

  const result: RichTextBlock = {
    type,
    children: children as RichTextBlock['children'],
  };

  if (type === 'heading') {
    const level = Number(block.level);
    result.level = ([1, 2, 3, 4, 5, 6].includes(level) ? level : 2) as 1 | 2 | 3 | 4 | 5 | 6;
  }
  if (
    block.align === 'left' ||
    block.align === 'center' ||
    block.align === 'right' ||
    block.align === 'justify'
  ) {
    result.align = block.align;
  }
  return result;
}

function sanitizeSpan(value: unknown): RichTextSpan | null {
  if (typeof value === 'string') {
    return { text: stripHtml(value) };
  }
  if (!value || typeof value !== 'object') return null;
  const span = value as Record<string, unknown>;
  const text = stripHtml(String(span.text ?? ''));
  if (containsDangerousPayload(text)) return { text: '' };
  const marks = Array.isArray(span.marks)
    ? span.marks.filter((mark): mark is RichTextMark => typeof mark === 'string' && MARKS.has(mark))
    : undefined;
  const href =
    typeof span.href === 'string' &&
    (span.href.startsWith('/') ||
      span.href.startsWith('#') ||
      span.href.startsWith('https://') ||
      span.href.startsWith('http://') ||
      span.href.startsWith('mailto:') ||
      span.href.startsWith('tel:'))
      ? span.href
      : undefined;
  return { text, ...(marks?.length ? { marks } : {}), ...(href ? { href } : {}) };
}

function parseInline(html: string): RichTextSpan[] {
  const withoutScripts = stripHtml(html);
  return [{ text: withoutScripts }];
}
