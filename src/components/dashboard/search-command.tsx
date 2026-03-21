'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { TranscriptSearch } from '@/components/dashboard/transcript-search'

export function SearchCommand() {
  const [open, setOpen] = useState(false)

  // Cmd+K / Ctrl+K keyboard shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setOpen((prev) => !prev)
    }
    if (e.key === 'Escape' && open) {
      setOpen(false)
    }
  }, [open])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground gap-2 hidden sm:flex"
        title="חיפוש בתמלולים (Ctrl+K)"
      >
        <Search className="h-4 w-4" />
        <span className="text-xs">חיפוש</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground sm:hidden"
        title="חיפוש בתמלולים"
      >
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden" showCloseButton={false}>
          <DialogTitle className="sr-only">חיפוש בתמלולים</DialogTitle>
          <TranscriptSearch
            compact
            autoFocus
            onResultClick={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
