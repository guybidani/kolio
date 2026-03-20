/**
 * KOLIO DESIGN TOKENS
 *
 * Reference constants for the design system.
 * Use Tailwind classes when possible. Use these tokens for
 * programmatic access (charts, canvas, third-party libs).
 */

// ============================================================
// BRAND COLORS
// ============================================================
export const brand = {
  50: '#EEF2FF',
  100: '#E0E7FF',
  200: '#C7D2FE',
  300: '#A5B4FC',
  400: '#818CF8',
  500: '#6366F1', // Primary
  600: '#4F46E5',
  700: '#4338CA',
  800: '#3730A3',
  900: '#312E81',
  950: '#1E1B4B',
} as const

// ============================================================
// SEMANTIC COLORS
// ============================================================
export const semantic = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const

// ============================================================
// SCORE COLORS (1-10 gradient: red -> amber -> green)
// Use for call scores, performance metrics, skill ratings
// ============================================================
export const scoreColors = {
  1: '#EF4444',
  2: '#F97316',
  3: '#F97316',
  4: '#EAB308',
  5: '#EAB308',
  6: '#84CC16',
  7: '#22C55E',
  8: '#10B981',
  9: '#059669',
  10: '#047857',
} as const

export const scoreColorsDark = {
  1: '#F87171',
  2: '#FB923C',
  3: '#FB923C',
  4: '#FACC15',
  5: '#FACC15',
  6: '#A3E635',
  7: '#4ADE80',
  8: '#34D399',
  9: '#2DD4BF',
  10: '#14B8A6',
} as const

/** Get score color by numeric value */
export function getScoreColor(score: number, dark = false): string {
  const clamped = Math.max(1, Math.min(10, Math.round(score)))
  const colors = dark ? scoreColorsDark : scoreColors
  return colors[clamped as keyof typeof colors]
}

/** Get score label */
export function getScoreLabel(score: number): string {
  if (score <= 3) return 'needs-work'
  if (score <= 5) return 'developing'
  if (score <= 7) return 'good'
  if (score <= 9) return 'excellent'
  return 'outstanding'
}

// ============================================================
// CHART COLORS (use in Recharts, Chart.js, etc.)
// ============================================================
export const chartColors = {
  light: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#F43F5E', '#84CC16'],
  dark: ['#818CF8', '#A78BFA', '#F472B6', '#FBBF24', '#34D399', '#22D3EE', '#FB7185', '#A3E635'],
} as const

// ============================================================
// TYPOGRAPHY SCALE
// ============================================================
export const typography = {
  /** Font families - these map to CSS custom properties */
  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-geist-mono)',
    heading: 'var(--font-sans)',
  },
  /** Size scale in rem */
  fontSize: {
    caption: '0.75rem',    // 12px
    small: '0.8125rem',    // 13px
    body: '0.875rem',      // 14px
    bodyLg: '1rem',        // 16px
    h6: '1rem',            // 16px
    h5: '1.125rem',        // 18px
    h4: '1.25rem',         // 20px
    h3: '1.5rem',          // 24px
    h2: '1.875rem',        // 30px
    h1: '2.25rem',         // 36px
    display: '3rem',       // 48px
    displayLg: '3.75rem',  // 60px
  },
  /** Font weights */
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  /** Line height ratios */
  lineHeight: {
    tight: 1.1,       // Headings, display
    snug: 1.25,        // Sub-headings
    normal: 1.5,       // Body text
    relaxed: 1.625,    // Long-form reading
    loose: 2,          // Extra spacing
  },
} as const

// ============================================================
// SPACING & LAYOUT
// ============================================================
export const layout = {
  /** Base unit = 4px. Multiply for consistent spacing. */
  baseUnit: 4,
  /** Sidebar */
  sidebarWidth: 260,
  sidebarWidthCollapsed: 68,
  /** Content */
  maxContentWidth: 1280,
  headerHeight: 56,
  /** Card padding */
  cardPadding: {
    sm: 16,   // p-4
    md: 20,   // p-5
    lg: 24,   // p-6
  },
  /** Section margins */
  sectionSpacing: {
    sm: 48,   // py-12
    md: 64,   // py-16
    lg: 80,   // py-20
  },
} as const

// ============================================================
// ANIMATION
// ============================================================
export const animation = {
  duration: {
    fast: 100,
    normal: 200,
    slow: 300,
    slower: 500,
  },
  easing: {
    outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
    outQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
    inOutSmooth: 'cubic-bezier(0.65, 0, 0.35, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const
