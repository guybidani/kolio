'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, FileAudio, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error'
  progress: number
  repName?: string
  callId?: string
  error?: string
}

export default function UploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [defaultRep, setDefaultRep] = useState('')
  const abortControllers = useRef<Map<string, AbortController>>(new Map())

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadedFile[] = Array.from(fileList)
        .filter((f) => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|m4a|ogg|webm|flac)$/i))
        .map((f) => ({
          id: Math.random().toString(36).slice(2),
          file: f,
          name: f.name,
          size: f.size,
          status: 'pending' as const,
          progress: 0,
          repName: defaultRep,
        }))
      setFiles((prev) => [...prev, ...newFiles])
    },
    [defaultRep]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const removeFile = (id: string) => {
    const controller = abortControllers.current.get(id)
    if (controller) controller.abort()
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadSingleFile = async (uploadFile: UploadedFile) => {
    const controller = new AbortController()
    abortControllers.current.set(uploadFile.id, controller)

    setFiles((prev) =>
      prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 10 } : f))
    )

    try {
      const formData = new FormData()
      formData.append('file', uploadFile.file)
      formData.append('direction', 'UNKNOWN')

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === uploadFile.id && f.status === 'uploading' && f.progress < 90) {
              return { ...f, progress: f.progress + 10 }
            }
            return f
          })
        )
      }, 300)

      const res = await fetch('/api/calls/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errData.error || 'Upload failed')
      }

      const data = await res.json()

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'done' as const, progress: 100, callId: data.callId }
            : f
        )
      )
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'error' as const, error: err instanceof Error ? err.message : 'שגיאה בהעלאה' }
            : f
        )
      )
    } finally {
      abortControllers.current.delete(uploadFile.id)
    }
  }

  const startUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')
    // Upload files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await uploadSingleFile(file)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const doneFiles = files.filter((f) => f.status === 'done')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">העלאת שיחות</h1>
        <p className="text-muted-foreground">
          העלו קבצי אודיו לניתוח. תומכים ב-MP3, WAV, M4A, OGG, WebM, FLAC
        </p>
      </div>

      {/* Default rep selection */}
      <div className="rounded-xl bg-muted/50 border border-border p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-foreground whitespace-nowrap">נציג ברירת מחדל:</label>
          <Input
            placeholder="שם הנציג (אופציונלי)"
            value={defaultRep}
            onChange={(e) => setDefaultRep(e.target.value)}
            className="max-w-xs bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/5'
            : 'border-border hover:border-indigo-500/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">גררו קבצי אודיו לכאן</h3>
        <p className="text-sm text-muted-foreground mb-4">
          או לחצו לבחירת קבצים
        </p>
        <Button
          variant="outline"
          className="border-border text-muted-foreground hover:bg-muted/50"
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.multiple = true
            input.accept = 'audio/*,.mp3,.wav,.m4a,.ogg,.webm,.flac'
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement
              if (target.files) handleFiles(target.files)
            }
            input.click()
          }}
        >
          בחרו קבצים
        </Button>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
          <div className="p-5 pb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              קבצים ({files.length})
            </h3>
            <div className="flex gap-2">
              {doneFiles.length === 1 && doneFiles[0].callId && (
                <Button
                  variant="outline"
                  className="border-border text-muted-foreground hover:bg-muted/50"
                  onClick={() => router.push(`/dashboard/calls/${doneFiles[0].callId}`)}
                >
                  צפה בשיחה
                </Button>
              )}
              {doneFiles.length > 1 && (
                <Button
                  variant="outline"
                  className="border-border text-muted-foreground hover:bg-muted/50"
                  onClick={() => router.push('/dashboard/calls')}
                >
                  צפה בשיחות
                </Button>
              )}
              {pendingCount > 0 && (
                <Button onClick={startUpload} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  <Upload className="h-4 w-4 ml-2" />
                  העלה {pendingCount} קבצים
                </Button>
              )}
            </div>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
              >
                <FileAudio className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatSize(file.size)}
                    </span>
                  </div>
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-1 mt-1" />
                  )}
                  {file.repName && (
                    <p className="text-xs text-muted-foreground">נציג: {file.repName}</p>
                  )}
                  {file.error && (
                    <p className="text-xs text-red-400 mt-1">{file.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {file.status === 'pending' && (
                    <Badge variant="outline" className="bg-muted/50 border-border text-muted-foreground">ממתין</Badge>
                  )}
                  {file.status === 'uploading' && (
                    <Badge variant="outline" className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                      <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                      מעלה {file.progress}%
                    </Badge>
                  )}
                  {file.status === 'processing' && (
                    <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-400">
                      <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                      מעבד
                    </Badge>
                  )}
                  {file.status === 'done' && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="h-3 w-3 ml-1" />
                      הושלם
                    </Badge>
                  )}
                  {file.status === 'error' && (
                    <Badge className="bg-red-500/10 text-red-400 border border-red-500/20">
                      <AlertCircle className="h-3 w-3 ml-1" />
                      שגיאה
                    </Badge>
                  )}
                  {(file.status === 'pending' || file.status === 'error') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
