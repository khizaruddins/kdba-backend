import { Injectable } from '@nestjs/common';
import { WebsiteNode, StyleDefinition } from '../types/document.types';

export type ResponsiveStatus = 'inherited' | 'overridden' | 'reset';

export interface PropertyResponsiveMeta {
  path: string;
  status: ResponsiveStatus;
  desktopValue?: unknown;
  overrideValue?: unknown;
  effectiveValue?: unknown;
}

export interface NodeResponsiveAnalysis {
  nodeId: string;
  breakpoint: 'tablet' | 'mobile' | string;
  properties: Record<string, PropertyResponsiveMeta>;
  hasOverrides: boolean;
  effectiveStyles: StyleDefinition;
}

@Injectable()
export class ResponsiveResolverService {
  /**
   * Deep merge desktop styles with responsive override styles to produce the effective style.
   */
  resolveEffectiveStyles(
    node: WebsiteNode,
    breakpoint: 'desktop' | 'tablet' | 'mobile' | string,
  ): StyleDefinition {
    const desktop = node.styles || {};
    if (breakpoint === 'desktop') {
      return JSON.parse(JSON.stringify(desktop));
    }

    const overrides =
      breakpoint === 'tablet'
        ? node.responsive?.tablet
        : breakpoint === 'mobile'
          ? node.responsive?.mobile
          : node.responsive?.custom?.[breakpoint];

    if (!overrides) {
      return JSON.parse(JSON.stringify(desktop));
    }

    return this.deepMerge(desktop, overrides);
  }

  /**
   * Analyze all properties for a given node and breakpoint to determine whether each
   * is Inherited from Desktop, Overridden on Breakpoint, or Reset.
   */
  analyzeNodeResponsive(
    node: WebsiteNode,
    breakpoint: 'tablet' | 'mobile' | string,
  ): NodeResponsiveAnalysis {
    const desktop = node.styles || {};
    const overrides =
      breakpoint === 'tablet'
        ? node.responsive?.tablet
        : breakpoint === 'mobile'
          ? node.responsive?.mobile
          : node.responsive?.custom?.[breakpoint];

    const properties: Record<string, PropertyResponsiveMeta> = {};
    const effectiveStyles = this.resolveEffectiveStyles(node, breakpoint);

    const flatDesktop = this.flattenObject(desktop);
    const flatOverrides = overrides ? this.flattenObject(overrides) : {};

    // Collect all paths
    const allPaths = new Set([...Object.keys(flatDesktop), ...Object.keys(flatOverrides)]);

    for (const path of allPaths) {
      const desktopVal = flatDesktop[path];
      const overrideVal = flatOverrides[path];

      if (overrideVal !== undefined) {
        properties[path] = {
          path,
          status: 'overridden',
          desktopValue: desktopVal,
          overrideValue: overrideVal,
          effectiveValue: overrideVal,
        };
      } else {
        properties[path] = {
          path,
          status: 'inherited',
          desktopValue: desktopVal,
          overrideValue: undefined,
          effectiveValue: desktopVal,
        };
      }
    }

    return {
      nodeId: node.id,
      breakpoint,
      properties,
      hasOverrides: Object.keys(flatOverrides).length > 0,
      effectiveStyles,
    };
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key of Object.keys(obj || {})) {
      const val = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        Object.assign(result, this.flattenObject(val, newKey));
      } else if (val !== undefined) {
        result[newKey] = val;
      }
    }

    return result;
  }
}
