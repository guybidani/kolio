'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, FileAudio, X, CheckCircle, Loader2 } from 'lucide-react'

interface UploadedFile {
  id: string
  name: string
  size: number
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error'
  progress: number
  repName?: string
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [defaultRep, setDefaultRep] = useState('')

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadedFile[] = Array.from(fileList)
        .filter((f) => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|m4a|ogg|webm|flac)$/i))
        .map((f) => ({
          id: Math.random().toString(36).slice(2),
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
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const startUpload = async () => {
    // In production, this would upload to R2 and enqueue processing
    for (const file of files.filter((f) => f.status === 'pending')) {
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading' as const, progress: 0 } : f))
      )

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((r) => setTimeout(r, 200))
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress: i } : f))
        )
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'processing' as const, progress: 100 } : f))
      )

      // Simulate processing
      await new Promise((r) => setTimeout(r, 1000))
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'done' as const } : f))
      )
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">העלאת שיחות</h1>
        <p className="text-muted-foreground">
          העלו קבצי אודיו לניתוח. תומכים ב-MP3, WAV, M4A, OGG, WebM, FLAC
        </p>
      </div>

      {/* Default rep selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap">נציג ברירת מחדל:</label>
            <Input
              placeholder="שם הנציג (אופציונלי)"
              value={defaultRep}
              onChange={(e) => setDefaultRep(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">גררו קבצי אודיו לכאן</h3>
        <p className="text-sm text-muted-foreground mb-4">
          או לחצו לבחירת קבצים
        </p>
        <Button
          variant="outline"
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              קבצים ({files.length})
            </CardTitle>
            {pendingCount > 0 && (
              <Button onClick={startUpload}>
                <Upload className="h-4 w-4 ml-2" />
                העלה {pendingCount} קבצים
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <FileAudio className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{file.name}</p>
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
                </div>
                <div className="flex items-center gap-2">
                  {file.status === 'pending' && (
                    <Badge variant="secondary">ממתין</Badge>
                  )}
                  {file.status === 'uploading' && (
                    <Badge variant="outline">
                      <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                      מעלה {file.progress}%
                    </Badge>
                  )}
                  {file.status === 'processing' && (
                    <Badge variant="outline">
                      <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                      מעבד
                    </Badge>
                  )}
                  {file.status === 'done' && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 ml-1" />
                      הושלם
                    </Badge>
                  )}
                  {file.status === 'error' && (
                    <Badge variant="destructive">שגיאה</Badge>
                  )}
                  {file.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
