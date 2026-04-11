import type { HassEntity, CalendarEvent } from '@/types/ha-types'

function apiBase(): string {
  const base = window.location.pathname.replace(/\/?$/, '/')
  return `${window.location.origin}${base}ha-api`
}

export async function fetchStates(): Promise<HassEntity[]> {
  const res = await fetch(`${apiBase()}/states`)
  if (!res.ok) throw new Error(`Failed to fetch states: ${res.status}`)
  return res.json() as Promise<HassEntity[]>
}

export async function fetchHAConfig(): Promise<{ location_name: string; language?: string }> {
  const res = await fetch(`${apiBase()}/config`)
  if (!res.ok) throw new Error(`Failed to fetch config: ${res.status}`)
  return res.json() as Promise<{ location_name: string; language?: string }>
}

/** Fetch upcoming events for a calendar entity (next N days) */
export async function fetchCalendarEvents(entityId: string, days = 7): Promise<CalendarEvent[]> {
  const start = new Date().toISOString()
  const end = new Date(Date.now() + days * 86_400_000).toISOString()
  const url = `${apiBase()}/calendars/${encodeURIComponent(entityId)}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    return res.json() as Promise<CalendarEvent[]>
  } catch {
    return []
  }
}
