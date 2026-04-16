import { userKey } from './user-context'

export type EntityLabelMap = Record<string, string>  // entity_id → custom label

function key() { return userKey('hk_entity_labels') }

export function getEntityLabels(): EntityLabelMap {
  try {
    return JSON.parse(localStorage.getItem(key()) ?? '{}') as EntityLabelMap
  } catch {
    return {}
  }
}

export function saveEntityLabels(map: EntityLabelMap): void {
  localStorage.setItem(key(), JSON.stringify(map))
}
