import { useState, useEffect } from 'react'
import { CalendarDays, X, Clock } from 'lucide-react'
import { useEntity } from '@/hooks/useEntities'
import { entityLabel } from '@/lib/utils'
import { BaseTile } from './BaseTile'
import { fetchCalendarEvents } from '@/lib/ha-api'
import type { CalendarEvent } from '@/types/ha-types'

function formatEventTime(dt: string | undefined, date: string | undefined): string {
  if (date) return new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface CalendarTileProps {
  entityId: string
}

export function CalendarTile({ entityId }: CalendarTileProps) {
  const entity = useEntity(entityId)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchCalendarEvents(entityId).then(setEvents).catch(() => setEvents([]))
  }, [entityId])

  if (!entity) return null

  const attrs = entity.attributes
  const label = entityLabel(entityId, attrs.friendly_name)
  const next = events[0]
  const nextLabel = next ? next.summary : 'No upcoming events'
  const nextTime = next ? formatEventTime(next.start.dateTime, next.start.date) : ''

  return (
    <>
      <BaseTile
        isActive={!!next}
        activeColor="blue"
        icon={<CalendarDays className="w-full h-full" />}
        label={label}
        sublabel={nextLabel}
        onClick={() => setShowModal(true)}
      >
        {nextTime ? (
          <p className="text-[10px] text-ios-secondary truncate flex items-center gap-0.5 mt-0.5">
            <Clock className="w-2.5 h-2.5 shrink-0" />{nextTime}
          </p>
        ) : null}
      </BaseTile>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-ios-card rounded-3xl w-full max-w-sm max-h-[75dvh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-ios-blue" />
                <p className="font-semibold text-ios-label">{label}</p>
              </div>
              <button onClick={() => setShowModal(false)}>
                <X className="w-4 h-4 text-ios-secondary" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-ios-secondary text-center py-6">No upcoming events</p>
              ) : events.map((ev, i) => (
                <div key={i} className="bg-ios-card-2 rounded-2xl px-4 py-3 space-y-0.5">
                  <p className="text-sm font-semibold text-ios-label truncate">{ev.summary}</p>
                  <p className="text-xs text-ios-secondary flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    {formatEventTime(ev.start.dateTime, ev.start.date)}
                    {ev.end.dateTime && ` – ${formatEventTime(ev.end.dateTime, ev.end.date)}`}
                  </p>
                  {ev.location && (
                    <p className="text-xs text-ios-secondary truncate">📍 {ev.location}</p>
                  )}
                  {ev.description && (
                    <p className="text-xs text-ios-secondary mt-1 line-clamp-2">{ev.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
