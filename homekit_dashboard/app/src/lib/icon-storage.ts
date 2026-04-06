import { userKey } from './user-context'

export type EntityIconMap = Record<string, string>  // entity_id → lucide icon name

function key() { return userKey('hk_entity_icons') }

export function getEntityIcons(): EntityIconMap {
  try {
    return JSON.parse(localStorage.getItem(key()) ?? '{}') as EntityIconMap
  } catch {
    return {}
  }
}

export function saveEntityIcons(map: EntityIconMap): void {
  localStorage.setItem(key(), JSON.stringify(map))
}
