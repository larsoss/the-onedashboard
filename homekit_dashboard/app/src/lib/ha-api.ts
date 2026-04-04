import type { HassEntity } from '@/types/ha-types'

function apiBase(): string {
  const base = window.location.pathname.replace(/\/?$/, '/')
  return `${window.location.origin}${base}ha-api`
}

export async function fetchStates(): Promise<HassEntity[]> {
  const res = await fetch(`${apiBase()}/states`)
  if (!res.ok) throw new Error(`Failed to fetch states: ${res.status}`)
  return res.json() as Promise<HassEntity[]>
}

export async function fetchHAConfig(): Promise<{ location_name: string }> {
  const res = await fetch(`${apiBase()}/config`)
  if (!res.ok) throw new Error(`Failed to fetch config: ${res.status}`)
  return res.json() as Promise<{ location_name: string }>
}
