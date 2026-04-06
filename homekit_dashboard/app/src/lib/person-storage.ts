import { userKey } from './user-context'

export interface PersonConfig {
  batteryLevel?: string       // sensor entity_id for battery %
  batteryState?: string       // sensor entity_id for charging state
  wifiSsid?: string           // sensor entity_id for wifi SSID
  steps?: string              // sensor entity_id for step counter
  homeProximity?: string      // sensor entity_id for distance from home
  activity?: string           // sensor entity_id for activity detection
  spotify?: string            // media_player entity_id for spotify
  geocodedLocation?: string   // sensor entity_id for geocoded address
  ringerMode?: string         // sensor entity_id for ringer mode
}

export type PersonConfigMap = Record<string, PersonConfig>

function key() { return userKey('hk_person_configs') }

export function getPersonConfigs(): PersonConfigMap {
  try {
    return JSON.parse(localStorage.getItem(key()) ?? '{}') as PersonConfigMap
  } catch {
    return {}
  }
}

export function savePersonConfigs(map: PersonConfigMap): void {
  localStorage.setItem(key(), JSON.stringify(map))
}
