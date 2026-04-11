import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function entityLabel(entityId: string, friendlyName?: unknown): string {
  if (typeof friendlyName === 'string' && friendlyName) return friendlyName
  return entityId
    .split('.')[1]
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function brightnessToPercent(brightness: unknown): number {
  if (typeof brightness !== 'number') return 0
  return Math.round((brightness / 255) * 100)
}

export function percentToBrightness(percent: number): number {
  return Math.round((percent / 100) * 255)
}

export function getDomain(entityId: string): string {
  return entityId.split('.')[0]
}

export function formatTemp(temp: unknown, unit = '°C'): string {
  if (typeof temp !== 'number') return '--'
  return `${Math.round(temp)}${unit}`
}

export function deriveRoomTabs() {
  return [
    { id: 'all',      label: 'All',      domains: [] as string[] },
    { id: 'lights',   label: 'Lights',   domains: ['light'] },
    { id: 'climate',  label: 'Climate',  domains: ['climate'] },
    { id: 'security', label: 'Security', domains: ['lock'] },
    { id: 'switches', label: 'Switches', domains: ['switch', 'input_boolean'] },
    { id: 'covers',   label: 'Covers',   domains: ['cover'] },
    { id: 'sensors',  label: 'Sensors',  domains: ['sensor', 'binary_sensor'] },
  ]
}

/** Human-readable relative time, e.g. "just now", "5m ago", "2h ago" */
export function relativeTime(isoStr: string | undefined): string {
  if (!isoStr) return ''
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
