import { useState, useEffect, useMemo } from 'react'
import { CalendarDays, X, Clock, ChevronLeft, ChevronRight, MapPin, List, Grid3x3 } from 'lucide-react'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel } from '@/lib/utils'
import { BaseTile } from './BaseTile'
import { fetchCalendarEvents } from '@/lib/ha-api'
import type { CalendarEvent } from '@/types/ha-types'
import { cn } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────

function isAllDay(ev: CalendarEvent): boolean {
  return !ev.start.dateTime && !!ev.start.date
}

function startMs(ev: CalendarEvent): number {
  return ev.start.dateTime
    ? new Date(ev.start.dateTime).getTime()
    : new Date(ev.start.date!).getTime()
}

function endMs(ev: CalendarEvent): number {
  if (ev.end?.dateTime) return new Date(ev.end.dateTime).getTime()
  if (ev.end?.date)     return new Date(ev.end.date).getTime()
  return startMs(ev) + 3_600_000
}

/** Relative human label for when an event starts */
export function relativeTime(ev: CalendarEvent): string {
  const now = Date.now()
  const start = startMs(ev)
  const end   = endMs(ev)

  if (isAllDay(ev)) {
    const d    = new Date(ev.start.date!)
    const tod  = new Date(); tod.setHours(0,0,0,0)
    const tom  = new Date(tod); tom.setDate(tod.getDate() + 1)
    if (d.toDateString() === tod.toDateString()) return 'Vandaag'
    if (d.toDateString() === tom.toDateString()) return 'Morgen'
    return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (start <= now && end > now) return 'Nu bezig'
  if (start < now) return 'Afgelopen'
  const diffMins = Math.floor((start - now) / 60_000)
  if (diffMins < 60)      return `Over ${diffMins} min`
  if (diffMins < 60 * 24) return `Over ${Math.floor(diffMins / 60)}u`
  const days = Math.floor(diffMins / (60 * 24))
  if (days === 1) return 'Morgen'
  return new Date(start).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Progress 0–1 for an ongoing event, null otherwise */
function eventProgress(ev: CalendarEvent): number | null {
  if (isAllDay(ev)) return null
  const now   = Date.now()
  const start = startMs(ev)
  const end   = endMs(ev)
  if (start > now || end <= now) return null
  return Math.min(1, (now - start) / (end - start))
}

function fmtTime(dt: string | undefined): string {
  if (!dt) return ''
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function dayLabel(dateStr: string): string {
  const d    = new Date(dateStr)
  const tod  = new Date(); tod.setHours(0,0,0,0)
  const tom  = new Date(tod); tom.setDate(tod.getDate() + 1)
  if (d.toDateString() === tod.toDateString()) return 'Vandaag'
  if (d.toDateString() === tom.toDateString()) return 'Morgen'
  return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })
}

// ── Event row (shared by list + grid) ────────────────────────────────────────

function EventRow({ ev, color = '#0A84FF' }: { ev: CalendarEvent; color?: string }) {
  const prog = eventProgress(ev)
  return (
    <div className="relative rounded-xl overflow-hidden bg-ios-card-2">
      {/* Colored left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: color }} />
      <div className="pl-3 pr-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-ios-label leading-snug">{ev.summary}</p>
          <span className="text-[10px] text-ios-secondary shrink-0 mt-0.5">{relativeTime(ev)}</span>
        </div>
        {!isAllDay(ev) && (
          <p className="text-xs text-ios-secondary mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            {fmtTime(ev.start.dateTime)}
            {ev.end?.dateTime && ` – ${fmtTime(ev.end.dateTime)}`}
          </p>
        )}
        {isAllDay(ev) && (
          <p className="text-xs text-ios-secondary mt-0.5">Hele dag</p>
        )}
        {ev.location && (
          <p className="text-xs text-ios-secondary mt-0.5 flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" />{ev.location}
          </p>
        )}
        {prog !== null && (
          <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${prog * 100}%`, background: color }} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Month grid view ───────────────────────────────────────────────────────────

const DOW_NL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

function MonthGrid({ events, color = '#0A84FF' }: { events: CalendarEvent[]; color?: string }) {
  const [month, setMonth] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d
  })
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const last  = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const startDow = (first.getDay() + 6) % 7 // Mon=0
    const arr: (Date | null)[] = Array(startDow).fill(null)
    for (let d = 1; d <= last.getDate(); d++)
      arr.push(new Date(month.getFullYear(), month.getMonth(), d))
    return arr
  }, [month])

  const byDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    events.forEach((ev) => {
      const key = ev.start.dateTime
        ? new Date(ev.start.dateTime).toDateString()
        : ev.start.date ? new Date(ev.start.date).toDateString() : null
      if (key) { if (!map[key]) map[key] = []; map[key].push(ev) }
    })
    return map
  }, [events])

  const today = new Date().toDateString()
  const selEvents = selectedDay ? (byDate[selectedDay] ?? []) : []

  const prevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
  const nextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))

  return (
    <div className="space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-white/10">
          <ChevronLeft className="w-4 h-4 text-ios-secondary" />
        </button>
        <p className="text-sm font-semibold text-ios-label capitalize">
          {month.toLocaleDateString([], { month: 'long', year: 'numeric' })}
        </p>
        <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-white/10">
          <ChevronRight className="w-4 h-4 text-ios-secondary" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7">
        {DOW_NL.map((d) => (
          <div key={d} className="text-[10px] text-center text-ios-secondary font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />
          const ds        = date.toDateString()
          const hasEvents = !!byDate[ds]
          const isToday   = ds === today
          const isSel     = ds === selectedDay
          return (
            <button
              key={ds}
              onClick={() => setSelectedDay(isSel ? null : ds)}
              className={cn(
                'flex flex-col items-center py-1.5 rounded-lg text-xs transition-colors',
                isSel    ? 'text-white'    : isToday ? 'font-bold' : 'text-ios-label',
              )}
              style={isSel ? { background: color } : undefined}
            >
              <span className={cn(isToday && !isSel && 'underline decoration-dotted')}>{date.getDate()}</span>
              {hasEvents && (
                <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: isSel ? '#fff' : color }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div className="space-y-1.5">
          {selEvents.length === 0 ? (
            <p className="text-xs text-ios-secondary text-center py-2">Geen afspraken</p>
          ) : selEvents.map((ev, i) => <EventRow key={i} ev={ev} color={color} />)}
        </div>
      )}
    </div>
  )
}

// ── List view ─────────────────────────────────────────────────────────────────

function ListView({ events, color = '#0A84FF' }: { events: CalendarEvent[]; color?: string }) {
  // Group events by day
  const groups = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    events.forEach((ev) => {
      const key = ev.start.dateTime
        ? new Date(ev.start.dateTime).toDateString()
        : ev.start.date ?? ''
      if (!map[key]) map[key] = []
      map[key].push(ev)
    })
    return Object.entries(map).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
  }, [events])

  if (groups.length === 0) {
    return <p className="text-sm text-ios-secondary text-center py-8">Geen aankomende afspraken</p>
  }

  return (
    <div className="space-y-4">
      {groups.map(([dateKey, evs]) => (
        <div key={dateKey}>
          <p className="text-xs font-semibold text-ios-secondary uppercase tracking-wider mb-2 px-1">
            {dayLabel(dateKey)}
          </p>
          <div className="space-y-1.5">
            {evs.map((ev, i) => <EventRow key={i} ev={ev} color={color} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── CalendarTile ──────────────────────────────────────────────────────────────

const CAL_COLORS = ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#FF453A', '#5AC8FA']

interface CalendarTileProps {
  entityId: string
}

export function CalendarTile({ entityId }: CalendarTileProps) {
  const entity = useEntity(entityId)
  const { entityLabels, entities } = useHA()
  const [events, setEvents]       = useState<CalendarEvent[]>([])
  const [showModal, setShowModal] = useState(false)
  const [view, setView]           = useState<'list' | 'grid'>('list')

  // Assign a consistent color based on entityId index among all calendar entities
  const color = useMemo(() => {
    const allCals = Object.keys(entities).filter((id) => id.startsWith('calendar.'))
    const idx = allCals.indexOf(entityId)
    return CAL_COLORS[Math.max(0, idx) % CAL_COLORS.length]
  }, [entities, entityId])

  useEffect(() => {
    fetchCalendarEvents(entityId, 30).then((evs) => {
      // Filter out already-finished events
      const now = Date.now()
      setEvents(evs.filter((ev) => endMs(ev) > now))
    }).catch(() => setEvents([]))
  }, [entityId])

  if (!entity) return null

  const label = entityLabel(entityId, entity.attributes.friendly_name, entityLabels)
  const next  = events[0]
  const prog  = next ? eventProgress(next) : null

  return (
    <>
      <BaseTile
        isActive={!!next}
        activeColor="blue"
        icon={<CalendarDays className="w-full h-full" />}
        label={label}
        sublabel={next ? next.summary : 'Geen afspraken'}
        onClick={() => setShowModal(true)}
      >
        {next && (
          <div className="space-y-1 mt-1">
            <p className="text-[11px] font-semibold truncate" style={{ color }}>
              {relativeTime(next)}
            </p>
            {!isAllDay(next) && (
              <p className="text-[10px] text-ios-secondary flex items-center gap-0.5 truncate">
                <Clock className="w-2.5 h-2.5 shrink-0" />
                {fmtTime(next.start.dateTime)}
                {next.end?.dateTime && ` – ${fmtTime(next.end.dateTime)}`}
              </p>
            )}
            {/* Progress bar for ongoing event */}
            {prog !== null && (
              <div className="h-0.5 rounded-full bg-white/10 overflow-hidden mt-1">
                <div className="h-full rounded-full transition-all" style={{ width: `${prog * 100}%`, background: color }} />
              </div>
            )}
          </div>
        )}
      </BaseTile>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-ios-card rounded-t-3xl sm:rounded-3xl w-full max-w-sm max-h-[80dvh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <p className="font-semibold text-ios-label">{label}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex bg-ios-card-2 rounded-lg p-0.5">
                  <button
                    onClick={() => setView('list')}
                    className={cn('p-1.5 rounded-md transition-colors', view === 'list' ? 'bg-white/20 text-white' : 'text-ios-secondary')}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setView('grid')}
                    className={cn('p-1.5 rounded-md transition-colors', view === 'grid' ? 'bg-white/20 text-white' : 'text-ios-secondary')}
                  >
                    <Grid3x3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-4 h-4 text-ios-secondary" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-4">
              {view === 'list'
                ? <ListView events={events} color={color} />
                : <MonthGrid events={events} color={color} />
              }
            </div>
          </div>
        </div>
      )}
    </>
  )
}
