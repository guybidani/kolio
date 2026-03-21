'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MessageCircleQuestion, Send, Loader2, ChevronDown, ChevronUp, Bot, User } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_QUESTIONS = [
  'מה היו ההתנגדויות?',
  'האם דובר על מחיר?',
  'מה הצעדים הבאים?',
  'מה הלקוח חיפש?',
  'איך הנציג טיפל בהתנגדויות?',
]

export function AskCall({ callId }: { callId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  async function askQuestion(question: string) {
    if (!question.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: question.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch(`/api/calls/${callId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'שגיאה בקבלת תשובה. נסה שוב.' },
        ])
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'שגיאה בחיבור לשרת. נסה שוב.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      askQuestion(input)
    }
  }

  return (
    <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircleQuestion className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">שאל את השיחה</span>
          <Bot className="h-4 w-4 text-muted-foreground" />
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="border-t border-border">
          {/* Quick questions */}
          {messages.length === 0 && (
            <div className="p-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2">שאלות מהירות:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => askQuestion(q)}
                    disabled={isLoading}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border border-border',
                      'bg-background hover:bg-muted text-foreground',
                      'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="max-h-80 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-2',
                    msg.role === 'user' ? 'justify-start' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'shrink-0 mt-0.5 rounded-full p-1',
                      msg.role === 'user'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {msg.role === 'user' ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm max-w-[85%]',
                      msg.role === 'user'
                        ? 'bg-primary/10 text-foreground'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="shrink-0 mt-0.5 rounded-full p-1 bg-muted text-muted-foreground">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-lg px-3 py-2 bg-muted">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="שאל שאלה על השיחה..."
                disabled={isLoading}
                className="flex-1 text-sm"
                dir="rtl"
              />
              <Button
                size="icon"
                onClick={() => askQuestion(input)}
                disabled={isLoading || !input.trim()}
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
