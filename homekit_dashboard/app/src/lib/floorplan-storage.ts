import { userKey } from './user-context'
import { scheduleSyncToServer } from './user-context'

export interface FloorplanHotspot {
  id: string
  entityId: string
  /** Position as percentage of image dimensions (0-100) */
  x: number
  y: number
}

export interface FloorplanConfig {
  imageUrl: string
  hotspots: FloorplanHotspot[]
}

export type FloorplanMap = Record<string, FloorplanConfig>

function key() { return userKey('hk_floorplans') }

export function getFloorplans(): FloorplanMap {
  try { return JSON.parse(localStorage.getItem(key()) ?? '{}') as FloorplanMap } catch { return {} }
}

export function saveFloorplans(map: FloorplanMap): void {
  localStorage.setItem(key(), JSON.stringify(map))
  scheduleSyncToServer()
}
