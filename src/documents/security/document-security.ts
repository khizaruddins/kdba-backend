import { HttpStatus } from '@nestjs/common';
import {
  DocumentErrorCode,
  DocumentException,
} from '../errors/document.errors';

const DANGEROUS_PATTERN =
  /javascript\s*:|data\s*:\s*text\/html|<script|<\/script|\bon\w+\s*=|expression\s*\(|@import|vbscript\s*:|data\s*:\s*application\/javascript/i;

const URL_KEYS = new Set([
  'href',
  'src',
  'url',
  'logoUrl',
  'ogImage',
  'canonicalUrl',
  'imageUrl',
  'primaryCtaUrl',
  'secondaryCtaUrl',
  'ctaUrl',
  'backgroundImage',
  'favicon',
]);

export function containsDangerousPayload(value: string): boolean {
  return DANGEROUS_PATTERN.test(value);
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

export function assertSafePlainText(value: string, path: string): string {
  if (containsDangerousPayload(value)) {
    throw new DocumentException(
      DocumentErrorCode.INVALID_NODE,
      `Unsafe content rejected at ${path}`,
      HttpStatus.BAD_REQUEST,
      { path },
    );
  }
  return stripHtml(value);
}

export function isSafeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return true;
  if (containsDangerousPayload(trimmed)) return false;
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  );
}

export function assertSafeUrl(value: string, path: string): string {
  const trimmed = value.trim();
  if (!isSafeUrl(trimmed)) {
    throw new DocumentException(
      DocumentErrorCode.INVALID_NODE,
      `Unsafe or invalid URL at ${path}`,
      HttpStatus.BAD_REQUEST,
      { path },
    );
  }
  return trimmed;
}

export function sanitizeUnknown(
  value: unknown,
  path: string,
  keyHint?: string,
): unknown {
  if (typeof value === 'string') {
    if (keyHint && URL_KEYS.has(keyHint)) {
      return assertSafeUrl(value, path);
    }
    if (/^\s*(https?:|javascript:|data:|mailto:|tel:|\/\/)/i.test(value)) {
      return assertSafeUrl(value, path);
    }
    return assertSafePlainText(value, path);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      sanitizeUnknown(item, `${path}[${index}]`, keyHint),
    );
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      output[key] = sanitizeUnknown(nested, `${path}.${key}`, key);
    }
    return output;
  }

  return value;
}

export function assertSafeCssValue(value: string, path: string): void {
  if (containsDangerousPayload(value) || /url\s*\(/i.test(value)) {
    throw new DocumentException(
      DocumentErrorCode.INVALID_NODE,
      `Unsafe style value at ${path}`,
      HttpStatus.BAD_REQUEST,
      { path },
    );
  }
}

export function sanitizeStyleModel(styles: Record<string, unknown>, path = 'styles'): void {
  const walk = (value: unknown, currentPath: string) => {
    if (typeof value === 'string') {
      if (/src$|href$|url$/i.test(currentPath.split('.').pop() || '')) {
        assertSafeUrl(value, currentPath);
      } else {
        assertSafeCssValue(value, currentPath);
      }
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, nested]) => {
        walk(nested, `${currentPath}.${key}`);
      });
    }
  };
  walk(styles, path);
}
