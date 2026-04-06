// localStorage keys
const KEY_OVERRIDES = 'hk_entity_area'
const KEY_CUSTOM_AREAS = 'hk_custom_areas'

// entity_id → area_id (or null = explicitly unassigned)
export type EntityAreaOverrides = Record<string, string | null>

export function getEntityAreaOverrides(): EntityAreaOverrides {
  try {
    return JSON.parse(localStorage.getItem(KEY_OVERRIDES) ?? '{}') as EntityAreaOverrides
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
  localStorage.setItem(KEY_OVERRIDES, JSON.stringify(overrides))
}

export function setEntityAreaOverrides(map: EntityAreaOverrides): void {
  localStorage.setItem(KEY_OVERRIDES, JSON.stringify(map))
}

export interface CustomArea {
  area_id: string
  name: string
}

export function getCustomAreas(): CustomArea[] {
  try {
    return JSON.parse(localStorage.getItem(KEY_CUSTOM_AREAS) ?? '[]') as CustomArea[]
  } catch {
    return []
  }
}

export function saveCustomAreas(areas: CustomArea[]): void {
  localStorage.setItem(KEY_CUSTOM_AREAS, JSON.stringify(areas))
}
