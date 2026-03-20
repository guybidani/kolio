'use client'

import { useState } from 'react'
import { CallCard } from '@/components/dashboard/call-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, SortAsc } from 'lucide-react'

const MOCK_CALLS = [
  {
    id: 'call-1',
    prospectName: 'דני כהן',
    prospectBusiness: 'קוסמטיקאית - Beauty by Dani',
    repName: 'גיא בידני',
    overallScore: 7.5,
    status: 'COMPLETE',
    direction: 'OUTBOUND',
    duration: 480,
    recordedAt: new Date().toISOString(),
    summary: 'שיחת מכירה ראשונה - הלקוחה מתעניינת בניהול קמפיינים.',
  },
  {
    id: 'call-2',
    prospectName: 'שרון לוי',
    prospectBusiness: 'קבלן שיפוצים',
    repName: 'מיכל דוד',
    overallScore: 5.2,
    status: 'COMPLETE',
    direction: 'INBOUND',
    duration: 320,
    recordedAt: new Date(Date.now() - 86400000).toISOString(),
    summary: 'ליד נכנס - מתעניין בבוט לווטסאפ.',
  },
  {
    id: 'call-3',
    prospectName: 'אבי גולן',
    prospectBusiness: 'עורך דין - משרד גולן',
    repName: 'יוסי אברהם',
    overallScore: 8.7,
    status: 'COMPLETE',
    direction: 'OUTBOUND',
    duration: 720,
    recordedAt: new Date(Date.now() - 172800000).toISOString(),
    summary: 'שיחת סגירה מצוינת. הלקוח חתם על חבילת Premium.',
  },
  {
    id: 'call-4',
    prospectName: 'רחל בן דוד',
    prospectBusiness: 'מכון יופי',
    repName: 'נועה שמיר',
    overallScore: 4.1,
    status: 'COMPLETE',
    direction: 'INBOUND',
    duration: 180,
    recordedAt: new Date(Date.now() - 259200000).toISOString(),
    summary: 'שיחה קצרה - הלקוחה ביקשה הצעת מחיר ונותקה.',
  },
  {
    id: 'call-5',
    prospectName: null,
    prospectBusiness: null,
    repName: 'גיא בידני',
    overallScore: null,
    status: 'ANALYZING',
    direction: 'OUTBOUND',
    duration: 540,
    recordedAt: new Date(Date.now() - 7200000).toISOString(),
    summary: null,
  },
  {
    id: 'call-6',
    prospectName: null,
    prospectBusiness: null,
    repName: 'מיכל דוד',
    overallScore: null,
    status: 'UPLOADED',
    direction: 'UNKNOWN',
    duration: 360,
    recordedAt: new Date(Date.now() - 10800000).toISOString(),
    summary: null,
  },
]

const STATUS_FILTERS = [
  { value: 'all', label: 'הכל' },
  { value: 'COMPLETE', label: 'הושלמו' },
  { value: 'ANALYZING', label: 'בניתוח' },
  { value: 'TRANSCRIBING', label: 'בתמלול' },
  { value: 'UPLOADED', label: 'ממתינות' },
  { value: 'FAILED', label: 'נכשלו' },
]

export default function CallsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = MOCK_CALLS.filter((call) => {
    if (statusFilter !== 'all' && call.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (call.prospectName?.toLowerCase().includes(q) ?? false) ||
        (call.prospectBusiness?.toLowerCase().includes(q) ?? false) ||
        (call.repName?.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">שיחות</h1>
          <p className="text-white/40">כל שיחות הצוות במקום אחד</p>
        </div>
        <Button className="border-white/10 text-white/70 hover:bg-white/5" variant="outline">
          <Filter className="h-4 w-4 ml-2" />
          סינון מתקדם
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            placeholder="חיפוש לפי שם ליד, עסק או נציג..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <Badge
              key={f.value}
              variant="outline"
              className={`cursor-pointer transition-colors ${
                statusFilter === f.value
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20'
                  : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
              }`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((call) => (
          <CallCard key={call.id} {...call} />
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl bg-white/5 border border-white/10 py-12 text-center">
            <Search className="h-8 w-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">לא נמצאו שיחות</p>
            <p className="text-sm text-white/20 mt-1">נסו לשנות את מילות החיפוש או הסינון</p>
          </div>
        )}
      </div>
    </div>
  )
}
