import { z } from 'zod';
import {
  ALL_NODE_TYPES,
  WebsiteNode,
} from '../../types/document.types';
import {
  StyleDefinitionSchema,
  ResponsiveStyleDefinitionSchema,
  ResponsiveVisibilitySchema,
} from './style.schema';
import { isAllowedChild, isLeafNode, isValidNodeType } from '../../contracts/component-registry';

// ─── SAFE STRING HELPERS ──────────────────────────────────────────────────────

const safeId = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Node ID must contain only alphanumeric characters, underscores, or dashes');

// ─── INTERACTIONS & ANIMATIONS SCHEMAS ────────────────────────────────────────

export const InteractionDefinitionSchema = z.object({
  trigger: z.enum(['click', 'hover', 'scroll-into-view', 'load']),
  action: z.enum(['navigate', 'scroll-to-anchor', 'open-modal', 'toggle-element', 'custom']),
  target: z.string().max(200).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const AnimationDefinitionSchema = z.object({
  type: z.enum(['fade', 'slide-up', 'slide-down', 'zoom', 'bounce', 'none']),
  duration: z.number().int().min(0).max(10000).optional(),
  delay: z.number().int().min(0).max(10000).optional(),
  easing: z.string().max(50).optional(),
  trigger: z.enum(['load', 'scroll', 'hover']).optional(),
});

// ─── RECURSIVE WEBSITE NODE SCHEMA ────────────────────────────────────────────

export const WebsiteNodeSchema: z.ZodType<WebsiteNode> = z.lazy(() =>
  z
    .object({
      id: safeId,
      type: z.enum(ALL_NODE_TYPES),
      name: z.string().trim().max(100).optional(),
      children: z.array(WebsiteNodeSchema).optional(),
      props: z.record(z.string(), z.unknown()).optional(),
      styles: StyleDefinitionSchema.optional(),
      responsive: ResponsiveStyleDefinitionSchema.optional(),
      visibility: ResponsiveVisibilitySchema.optional(),
      interactions: z.array(InteractionDefinitionSchema).optional(),
      animations: AnimationDefinitionSchema.optional(),
      locked: z.boolean().optional(),
    })
    .superRefine((node, ctx) => {
      const { type, children } = node;

      if (isLeafNode(type as any) && Array.isArray(children) && children.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['children'],
          message: `Node of type "${type}" is a leaf component and cannot have children.`,
        });
      }

      if (Array.isArray(children)) {
        children.forEach((child, index) => {
          if (!isAllowedChild(type as any, child.type as any)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['children', index],
              message: `Child node "${child.type}" is not allowed inside parent node "${type}".`,
            });
          }
        });
      }
    }),
);
