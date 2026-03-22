/**
 * KOLIO BENCHMARK DATA
 *
 * Industry benchmarks based on Gong's published research.
 * Used for comparing rep performance against proven best practices.
 */

export interface BenchmarkMetric {
  ideal: number
  unit: string
  label: string
  description: string
  source: string
  /** Lower bound of the metric range for display (0 = auto) */
  min: number
  /** Upper bound of the metric range for display (0 = auto) */
  max: number
  /** If true, lower is better (e.g., filler words) */
  lowerIsBetter?: boolean
}

export const SALES_BENCHMARKS: Record<string, BenchmarkMetric> = {
  talkRatio: {
    ideal: 43,
    unit: '%',
    label: 'יחס דיבור',
    description: 'אחוז הזמן שהנציג מדבר',
    source: 'Gong, 326K calls',
    min: 0,
    max: 100,
  },
  questionsPerCall: {
    ideal: 14,
    unit: '',
    label: 'שאלות לשיחה',
    description: 'מספר שאלות ממוקדות',
    source: 'Gong research',
    min: 0,
    max: 30,
  },
  longestMonologue: {
    ideal: 53,
    unit: 'שניות',
    label: 'מונולוג ארוך',
    description: 'אורך הדיבור הרצוף הארוך ביותר',
    source: 'Gong cold call data',
    min: 0,
    max: 180,
    lowerIsBetter: true,
  },
  pricingMentions: {
    ideal: 3.5,
    unit: '',
    label: 'אזכורי מחיר',
    description: 'מספר פעמים שהמחיר עלה',
    source: 'Gong, 11K opportunities',
    min: 0,
    max: 10,
  },
  pricingTiming: {
    ideal: 40,
    unit: 'דקות',
    label: 'עיתוי דיון במחיר',
    description: 'הדקה שבה המחיר עולה לראשונה',
    source: 'Gong research',
    min: 0,
    max: 60,
  },
  interactivity: {
    ideal: 20,
    unit: 'החלפות/דקה',
    label: 'אינטראקטיביות',
    description: 'מספר החלפות דובר לדקה',
    source: 'Research',
    min: 0,
    max: 40,
  },
} as const

export type BenchmarkKey = keyof typeof SALES_BENCHMARKS

/**
 * Classify how far a value is from the benchmark ideal.
 * Returns 'green' (±10%), 'yellow' (±20%), or 'red' (outside ±20%).
 */
export function classifyBenchmark(
  key: string,
  value: number
): 'green' | 'yellow' | 'red' {
  const benchmark = SALES_BENCHMARKS[key]
  if (!benchmark) return 'red'

  const { ideal } = benchmark
  if (ideal === 0) return value === 0 ? 'green' : 'red'

  const deviation = Math.abs(value - ideal) / ideal

  if (deviation <= 0.1) return 'green'
  if (deviation <= 0.2) return 'yellow'
  return 'red'
}

/**
 * Calculate the gap percentage from ideal.
 * Positive = above ideal, negative = below ideal.
 */
export function gapFromIdeal(key: string, value: number): number {
  const benchmark = SALES_BENCHMARKS[key]
  if (!benchmark || benchmark.ideal === 0) return 0
  return Math.round(((value - benchmark.ideal) / benchmark.ideal) * 100)
}

/**
 * Determine trend direction from two values.
 * Returns 'improving', 'declining', or 'stable'.
 */
export function getTrend(
  key: string,
  current: number,
  previous: number
): 'improving' | 'declining' | 'stable' {
  const benchmark = SALES_BENCHMARKS[key]
  if (!benchmark) return 'stable'

  const diff = current - previous
  if (Math.abs(diff) < 0.5) return 'stable'

  const { ideal, lowerIsBetter } = benchmark
  const currentGap = Math.abs(current - ideal)
  const previousGap = Math.abs(previous - ideal)

  if (currentGap < previousGap) return 'improving'
  if (currentGap > previousGap) return 'declining'

  // If lowerIsBetter and value went down, that's improving
  if (lowerIsBetter) return diff < 0 ? 'improving' : 'declining'

  return 'stable'
}
