import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'wordmark'
  className?: string
}

const sizes = {
  sm: { icon: 24, text: 'text-base' },
  md: { icon: 32, text: 'text-xl' },
  lg: { icon: 40, text: 'text-2xl' },
  xl: { icon: 48, text: 'text-3xl' },
}

/**
 * Kolio Logo
 *
 * Three asymmetric sound-wave bars representing voice/audio analysis.
 * The center bar is tallest, symbolizing the "Kol" (voice) reaching its peak.
 * Rounded pill shapes give it a modern, approachable feel.
 *
 * Variants:
 * - full: icon + wordmark
 * - icon: just the waveform icon
 * - wordmark: just the text
 */
export function Logo({ size = 'md', variant = 'full', className }: LogoProps) {
  const { icon: iconSize, text: textSize } = sizes[size]

  const icon = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Rounded square container */}
      <rect width="40" height="40" rx="10" className="fill-primary" />
      {/* Left bar - shortest */}
      <rect x="10" y="14" width="4" height="12" rx="2" fill="white" />
      {/* Center bar - tallest (the voice) */}
      <rect x="18" y="8" width="4" height="24" rx="2" fill="white" />
      {/* Right bar - medium */}
      <rect x="26" y="11" width="4" height="18" rx="2" fill="white" />
    </svg>
  )

  const wordmark = (
    <span className={cn('font-bold tracking-tight', textSize)}>
      Kolio
    </span>
  )

  if (variant === 'icon') return <div className={className}>{icon}</div>
  if (variant === 'wordmark') return <div className={className}>{wordmark}</div>

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {icon}
      {wordmark}
    </div>
  )
}

/**
 * Animated voice waveform bars for loading/processing states.
 * Use this when audio is being analyzed or a call is in progress.
 */
export function VoiceWave({ className }: { className?: string }) {
  return (
    <div className={cn('voice-bars', className)}>
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  )
}
