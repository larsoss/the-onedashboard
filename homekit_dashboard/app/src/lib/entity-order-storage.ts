import { userKey } from './user-context'

// Per-context (area_id or 'favorites') entity ordering
export type EntityOrderMap = Record<string, string[]>

function key() { return userKey('hk_entity_order') }

export function getEntityOrder(): EntityOrderMap {
  try {
    return JSON.parse(localStorage.getItem(key()) ?? '{}') as EntityOrderMap
  } catch {
    return {}
  }
}

export function saveEntityOrder(map: EntityOrderMap): void {
  localStorage.setItem(key(), JSON.stringify(map))
}
