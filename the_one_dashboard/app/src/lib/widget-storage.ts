import type { TileSpan } from './tile-sizes'

export type WidgetType =
  | 'light' | 'switch' | 'climate' | 'lock' | 'cover'
  | 'sensor' | 'binary_sensor' | 'camera' | 'calendar' | 'weather'
  | 'media_player' | 'scene' | 'automation' | 'script'
  | 'person' | 'clock'

export interface WidgetInstance {
  id: string
  type: WidgetType
  entityIds: string[]
  title?: string
  span: TileSpan
}

export type WidgetMap = Record<string, WidgetInstance[]>

const KEY = 'hk_widgets'

export function getWidgets(): WidgetMap {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as WidgetMap) : {}
  } catch {
    return {}
  }
}

export function saveWidgets(map: WidgetMap): void {
  localStorage.setItem(KEY, JSON.stringify(map))
}

export function defaultWidgetSpan(type: WidgetType, entityCount = 1): TileSpan {
  switch (type) {
    case 'clock':        return '2x1'
    case 'weather':      return '2x1'
    case 'media_player': return '2x2'
    case 'camera':       return '2x2'
    case 'calendar':     return '2x1'
    case 'person':       return '2x1'
    case 'light':        return entityCount > 1 ? '2x1' : '1x1'
    default:             return '1x1'
  }
}

export function makeWidgetId(): string {
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}
