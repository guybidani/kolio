'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'

interface Utterance {
  speaker: number
  text: string
  start: number
  end: number
}

interface CallPlayerProps {
  audioUrl: string
  utterances: Utterance[]
  keyMoments?: Array<{ time: number; label: string }>
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function CallPlayer({ audioUrl, utterances, keyMoments = [] }: CallPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [activeUtterance, setActiveUtterance] = useState(-1)

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }, [])

  const skip = useCallback(
    (delta: number) => {
      seek(Math.max(0, Math.min(duration, currentTime + delta)))
    },
    [currentTime, duration, seek]
  )

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      const t = audio.currentTime
      setCurrentTime(t)

      const idx = utterances.findIndex((u) => t >= u.start && t <= u.end)
      if (idx !== activeUtterance && idx >= 0) {
        setActiveUtterance(idx)
        const el = document.getElementById(`utt-${idx}`)
        if (el && transcriptRef.current) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }

    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [utterances, activeUtterance])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Audio Player Controls */}
      <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-4">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => skip(-10)} className="text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="אחורה 10 שניות">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={togglePlay} className="h-10 w-10 bg-indigo-600 hover:bg-indigo-500 text-white" aria-label={isPlaying ? 'עצור' : 'נגן'}>
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skip(10)} className="text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="קדימה 10 שניות">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-1">
            <Progress value={progress} className="h-2 cursor-pointer" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <Volume2 className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Key Moments Markers */}
        {keyMoments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {keyMoments.map((moment, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                onClick={() => seek(moment.time)}
              >
                {formatTime(moment.time)} - {moment.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Synced Transcript */}
      <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-base font-semibold text-foreground">תמלול</h3>
        </div>
        <div className="px-5 pb-5">
          <div
            ref={transcriptRef}
            className="max-h-96 overflow-y-auto space-y-2 text-sm"
          >
            {utterances.map((utt, i) => (
              <div
                key={i}
                id={`utt-${i}`}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  i === activeUtterance
                    ? 'bg-indigo-500/10 border border-indigo-500/20'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => seek(utt.start)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      utt.speaker === 0
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-emerald-500/15 text-emerald-400'
                    }`}
                  >
                    {utt.speaker === 0 ? 'נציג' : 'לקוח'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(utt.start)}
                  </span>
                </div>
                <p className="leading-relaxed text-foreground/70">{utt.text}</p>
              </div>
            ))}

            {utterances.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                אין תמלול זמין לשיחה זו
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
