import { getTheme, saveTheme, type ThemeConfig, DEFAULT_THEME } from './theme-storage'
import { getFavorites, saveFavorites, getAreaOrder, saveAreaOrder } from './area-storage'
import { getEntityIcons, saveEntityIcons, type EntityIconMap } from './icon-storage'
import { getTileSizes, saveTileSizes, type EntityTileSizes } from './tile-sizes'
import { getHiddenEntities, saveHiddenEntities } from './hidden-storage'
import { getEntityOrder, saveEntityOrder, type EntityOrderMap } from './entity-order-storage'
import { getPersonConfigs, savePersonConfigs, type PersonConfigMap } from './person-storage'

export interface UserSettings {
  theme?: ThemeConfig
  favorites?: string[]
  areaOrder?: string[]
  entityIcons?: EntityIconMap
  entityTileSizes?: EntityTileSizes
  hiddenEntities?: string[]
  entityOrder?: EntityOrderMap
  personConfigs?: PersonConfigMap
}

export function collectUserSettings(): UserSettings {
  return {
    theme: getTheme(),
    favorites: getFavorites(),
    areaOrder: getAreaOrder(),
    entityIcons: getEntityIcons(),
    entityTileSizes: getTileSizes(),
    hiddenEntities: getHiddenEntities(),
    entityOrder: getEntityOrder(),
    personConfigs: getPersonConfigs(),
  }
}

/** Apply server settings to localStorage (server wins, but only for defined keys) */
export function applyServerSettings(s: UserSettings): void {
  if (s.theme) saveTheme({ ...DEFAULT_THEME, ...s.theme })
  if (s.favorites) saveFavorites(s.favorites)
  if (s.areaOrder) saveAreaOrder(s.areaOrder)
  if (s.entityIcons) saveEntityIcons(s.entityIcons)
  if (s.entityTileSizes) saveTileSizes(s.entityTileSizes)
  if (s.hiddenEntities) saveHiddenEntities(s.hiddenEntities)
  if (s.entityOrder) saveEntityOrder(s.entityOrder)
  if (s.personConfigs) savePersonConfigs(s.personConfigs)
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
