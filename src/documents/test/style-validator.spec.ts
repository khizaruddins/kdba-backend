import {
  StyleDefinitionSchema,
  ThemeSystemV3Schema,
  ShadowDefinitionSchema,
  GradientDefinitionSchema,
} from '../schemas/v3/style.schema';

describe('Style & Theme Validation Engine (V3)', () => {
  describe('StyleDefinitionSchema', () => {
    it('should validate complete layout styles (flex, grid, spacing, sizing)', () => {
      const validStyle = {
        layout: {
          display: 'flex',
          position: 'relative',
          width: '100%',
          maxWidth: '1200px',
          overflow: 'hidden',
          zIndex: 10,
        },
        flex: {
          direction: 'row',
          wrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '24px',
        },
        spacing: {
          margin: { top: '0px', bottom: '32px', left: 'auto', right: 'auto' },
          padding: { top: '16px', bottom: '16px', left: '24px', right: '24px' },
        },
        size: {
          width: '100%',
          height: 'auto',
          minHeight: '400px',
        },
      };

      const result = StyleDefinitionSchema.safeParse(validStyle);
      expect(result.success).toBe(true);
    });

    it('should validate typography, colors, borders, and effects', () => {
      const validStyle = {
        typography: {
          fontFamily: 'Inter',
          fontSize: '24px',
          fontWeight: 700,
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          textAlign: 'center',
          color: '#0f172a',
        },
        background: {
          color: '#ffffff',
          opacity: 0.95,
        },
        border: {
          width: '1px',
          style: 'solid',
          color: '#e2e8f0',
          radius: { all: '12px' },
        },
        effects: {
          boxShadow: {
            x: 0,
            y: 8,
            blur: 24,
            spread: 0,
            color: 'rgba(0,0,0,0.12)',
          },
          opacity: 1,
        },
        transform: {
          scale: 1.02,
          translateY: '-4px',
        },
      };

      const result = StyleDefinitionSchema.safeParse(validStyle);
      expect(result.success).toBe(true);
    });

    it('should reject invalid CSS color schemes', () => {
      const invalidStyle = {
        background: {
          color: 'javascript:alert(1)', // Malicious input
        },
      };

      const result = StyleDefinitionSchema.safeParse(invalidStyle);
      expect(result.success).toBe(false);
    });

    it('should validate structured gradients', () => {
      const linearGradient = {
        type: 'linear',
        angle: 135,
        stops: [
          { color: '#6366f1', offset: 0 },
          { color: '#a855f7', offset: 100 },
        ],
      };

      const result = GradientDefinitionSchema.safeParse(linearGradient);
      expect(result.success).toBe(true);
    });

    it('should validate multi-layer box shadows', () => {
      const multiShadow = [
        { x: 0, y: 1, blur: 3, spread: 0, color: 'rgba(0,0,0,0.1)' },
        { x: 0, y: 10, blur: 20, spread: -5, color: 'rgba(0,0,0,0.04)' },
      ];

      const styleWithMultiShadow = {
        effects: {
          boxShadow: multiShadow,
        },
      };

      const result = StyleDefinitionSchema.safeParse(styleWithMultiShadow);
      expect(result.success).toBe(true);
    });
  });

  describe('ThemeSystemV3Schema', () => {
    it('should validate a full V3 theme system with color and typography tokens', () => {
      const fullTheme = {
        colors: {
          primary: '#5b5fef',
          secondary: '#111827',
          accent: '#06b6d4',
          background: '#ffffff',
          surface: '#f9fafb',
          text: '#111827',
          muted: '#6b7280',
          border: '#e5e7eb',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          custom: {
            brandHero: '#4338ca',
          },
        },
        typography: {
          h1: { fontFamily: 'Outfit', fontSize: '56px', fontWeight: 800, lineHeight: 1.1 },
          h2: { fontFamily: 'Outfit', fontSize: '40px', fontWeight: 700, lineHeight: 1.15 },
          h3: { fontFamily: 'Outfit', fontSize: '32px', fontWeight: 600, lineHeight: 1.25 },
          h4: { fontFamily: 'Inter', fontSize: '24px', fontWeight: 600, lineHeight: 1.3 },
          h5: { fontFamily: 'Inter', fontSize: '20px', fontWeight: 600, lineHeight: 1.35 },
          h6: { fontFamily: 'Inter', fontSize: '18px', fontWeight: 600, lineHeight: 1.4 },
          body: { fontFamily: 'Inter', fontSize: '16px', fontWeight: 400, lineHeight: 1.6 },
          caption: { fontFamily: 'Inter', fontSize: '13px', fontWeight: 400, lineHeight: 1.5 },
          label: { fontFamily: 'Inter', fontSize: '14px', fontWeight: 500, lineHeight: 1.4 },
          button: { fontFamily: 'Inter', fontSize: '15px', fontWeight: 600, lineHeight: 1.4 },
          quote: { fontFamily: 'Outfit', fontSize: '20px', fontWeight: 400, lineHeight: 1.6 },
        },
        breakpoints: {
          desktop: 1200,
          tablet: 768,
          mobile: 480,
        },
        borderRadius: 'lg',
        shadows: 'medium',
      };

      const result = ThemeSystemV3Schema.safeParse(fullTheme);
      expect(result.success).toBe(true);
    });
  });
});
