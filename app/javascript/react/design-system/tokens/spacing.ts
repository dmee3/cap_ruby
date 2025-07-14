// Spacing tokens for the design system
// Based on Tailwind's spacing scale for consistency

export const spacing = {
  // Base spacing units (in pixels)
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
  40: '160px',
  48: '192px',
  56: '224px',
  64: '256px',
} as const

// Semantic spacing tokens
export const semanticSpacing = {
  // Component spacing
  component: {
    padding: {
      xs: spacing[2],    // 8px
      sm: spacing[3],    // 12px
      md: spacing[4],    // 16px
      lg: spacing[6],    // 24px
      xl: spacing[8],    // 32px
    },
    margin: {
      xs: spacing[2],    // 8px
      sm: spacing[3],    // 12px
      md: spacing[4],    // 16px
      lg: spacing[6],    // 24px
      xl: spacing[8],    // 32px
    },
    gap: {
      xs: spacing[1],    // 4px
      sm: spacing[2],    // 8px
      md: spacing[3],    // 12px
      lg: spacing[4],    // 16px
      xl: spacing[6],    // 24px
    },
  },

  // Layout spacing
  layout: {
    section: spacing[8],     // 32px
    container: spacing[6],   // 24px
    page: spacing[8],        // 32px
  },

  // Form spacing
  form: {
    fieldGap: spacing[4],    // 16px
    labelGap: spacing[1],    // 4px
    groupGap: spacing[6],    // 24px
  },

  // Button spacing
  button: {
    padding: {
      sm: `${spacing[1]} ${spacing[2]}`,  // 4px 8px
      md: `${spacing[2]} ${spacing[4]}`,  // 8px 16px
      lg: `${spacing[3]} ${spacing[6]}`,  // 12px 24px
    },
  },
} as const

export type SpacingSize = keyof typeof spacing
export type SemanticSpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// Helper function to get spacing value
export const getSpacing = (size: SpacingSize): string => {
  return spacing[size]
}

// Helper function to get semantic spacing value
export const getSemanticSpacing = (
  category: keyof typeof semanticSpacing,
  subcategory: string,
  size: SemanticSpacingSize
): string => {
  return semanticSpacing[category][subcategory][size]
}
