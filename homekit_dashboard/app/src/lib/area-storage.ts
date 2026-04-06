import { userKey } from './user-context'

// localStorage keys — computed dynamically for per-user namespacing
function KEY_OVERRIDES() { return userKey('hk_entity_area') }
function KEY_CUSTOM_AREAS() { return userKey('hk_custom_areas') }
function KEY_FAVORITES() { return userKey('hk_favorites') }
function KEY_AREA_ORDER() { return userKey('hk_area_order') }

// entity_id → area_id (or null = explicitly unassigned)
export type EntityAreaOverrides = Record<string, string | null>

export function getEntityAreaOverrides(): EntityAreaOverrides {
  try {
    return JSON.parse(localStorage.getItem(KEY_OVERRIDES()) ?? '{}') as EntityAreaOverrides
  } catch {
    return {}
  }
}

export function setEntityAreaOverride(entityId: string, areaId: string | null): void {
  const overrides = getEntityAreaOverrides()
  if (areaId === undefined) {
    delete overrides[entityId]
  } else {
    overrides[entityId] = areaId
  }
  localStorage.setItem(KEY_OVERRIDES(), JSON.stringify(overrides))
}

export function setEntityAreaOverrides(map: EntityAreaOverrides): void {
  localStorage.setItem(KEY_OVERRIDES(), JSON.stringify(map))
}

export interface CustomArea {
  area_id: string
  name: string
}

export function getCustomAreas(): CustomArea[] {
  try {
    return JSON.parse(localStorage.getItem(KEY_CUSTOM_AREAS()) ?? '[]') as CustomArea[]
  } catch {
    return []
  }
}

export function saveCustomAreas(areas: CustomArea[]): void {
  localStorage.setItem(KEY_CUSTOM_AREAS(), JSON.stringify(areas))
}

// ── Favorites ────────────────────────────────────────────────────────────────

export function getFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY_FAVORITES()) ?? '[]') as string[] }
  catch { return [] }
}

export function saveFavorites(ids: string[]): void {
  localStorage.setItem(KEY_FAVORITES(), JSON.stringify(ids))
}

// ── Area display order ────────────────────────────────────────────────────────

export function getAreaOrder(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY_AREA_ORDER()) ?? '[]') as string[] }
  catch { return [] }
}

export function saveAreaOrder(ids: string[]): void {
  localStorage.setItem(KEY_AREA_ORDER(), JSON.stringify(ids))
}
