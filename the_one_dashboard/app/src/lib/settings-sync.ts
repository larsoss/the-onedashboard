import { getTheme, saveTheme, type ThemeConfig, DEFAULT_THEME } from './theme-storage'
import { getFavorites, saveFavorites, getAreaOrder, saveAreaOrder, getEntityAreaOverrides, setEntityAreaOverrides, getCustomAreas, saveCustomAreas, getAreaImages, saveAreaImages, type EntityAreaOverrides, type CustomArea, type AreaImages } from './area-storage'
import { getEntityIcons, saveEntityIcons, type EntityIconMap } from './icon-storage'
import { getEntityLabels, saveEntityLabels, type EntityLabelMap } from './label-storage'
import { getTileSizes, saveTileSizes, type EntityTileSizes } from './tile-sizes'
import { getHiddenEntities, saveHiddenEntities } from './hidden-storage'
import { getEntityOrder, saveEntityOrder, type EntityOrderMap } from './entity-order-storage'
import { getPersonConfigs, savePersonConfigs, type PersonConfigMap } from './person-storage'
import { getFloorplans, saveFloorplans, type FloorplanMap } from './floorplan-storage'

export interface UserSettings {
  theme?: ThemeConfig
  favorites?: string[]
  areaOrder?: string[]
  entityIcons?: EntityIconMap
  entityLabels?: EntityLabelMap
  entityTileSizes?: EntityTileSizes
  hiddenEntities?: string[]
  entityOrder?: EntityOrderMap
  personConfigs?: PersonConfigMap
  floorplans?: FloorplanMap
  entityAreaOverrides?: EntityAreaOverrides
  customAreas?: CustomArea[]
  areaImages?: AreaImages
}

export function collectUserSettings(): UserSettings {
  return {
    theme: getTheme(),
    favorites: getFavorites(),
    areaOrder: getAreaOrder(),
    entityIcons: getEntityIcons(),
    entityLabels: getEntityLabels(),
    entityTileSizes: getTileSizes(),
    hiddenEntities: getHiddenEntities(),
    entityOrder: getEntityOrder(),
    personConfigs: getPersonConfigs(),
    floorplans: getFloorplans(),
    entityAreaOverrides: getEntityAreaOverrides(),
    customAreas: getCustomAreas(),
    areaImages: getAreaImages(),
  }
}

/** Apply server settings to localStorage (server wins, but only for defined keys) */
export function applyServerSettings(s: UserSettings): void {
  if (s.theme) saveTheme({ ...DEFAULT_THEME, ...s.theme })
  if (s.favorites) saveFavorites(s.favorites)
  if (s.areaOrder) saveAreaOrder(s.areaOrder)
  if (s.entityIcons) saveEntityIcons(s.entityIcons)
  if (s.entityLabels) saveEntityLabels(s.entityLabels)
  if (s.entityTileSizes) saveTileSizes(s.entityTileSizes)
  if (s.hiddenEntities) saveHiddenEntities(s.hiddenEntities)
  if (s.entityOrder) saveEntityOrder(s.entityOrder)
  if (s.personConfigs) savePersonConfigs(s.personConfigs)
  if (s.floorplans) saveFloorplans(s.floorplans)
  if (s.entityAreaOverrides) setEntityAreaOverrides(s.entityAreaOverrides)
  if (s.customAreas) saveCustomAreas(s.customAreas)
  if (s.areaImages) saveAreaImages(s.areaImages)
}

/** Load settings from server for a given userId. Returns null on failure. */
export async function loadServerSettings(userId: string): Promise<UserSettings | null> {
  try {
    const res = await fetch(`/dashboard-api/settings/${encodeURIComponent(userId)}`)
    if (!res.ok) return null
    return await res.json() as UserSettings
  } catch {
    return null
  }
}
