// Raw HA entity as returned by REST /api/states and WebSocket events
export interface HassEntity {
  entity_id: string
  state: string
  attributes: Record<string, unknown>
  last_changed: string
  last_updated: string
  context: { id: string; parent_id: string | null; user_id: string | null }
}

// Domain-specific attribute helpers (use with type assertions)
export interface LightAttributes {
  friendly_name?: string
  brightness?: number                     // 0-255
  color_mode?: string                     // current active mode
  supported_color_modes?: string[]        // e.g. ['hs','color_temp']
  hs_color?: [number, number]            // [hue 0-360, sat 0-100]
  rgb_color?: [number, number, number]
  color_temp?: number                     // mireds
  color_temp_kelvin?: number
  min_mireds?: number
  max_mireds?: number
  min_color_temp_kelvin?: number
  max_color_temp_kelvin?: number
  supported_features?: number
}

export interface ClimateAttributes {
  friendly_name?: string
  current_temperature?: number
  temperature?: number
  hvac_modes?: string[]
  hvac_action?: string
  min_temp?: number
  max_temp?: number
  unit_of_measurement?: string
}

export interface LockAttributes {
  friendly_name?: string
  code_format?: string
}

export interface CoverAttributes {
  friendly_name?: string
  current_position?: number    // 0-100
  supported_features?: number
}

export interface SensorAttributes {
  friendly_name?: string
  unit_of_measurement?: string
  device_class?: string
  state_class?: string
}

// WebSocket message shapes
export interface HassWsMessage {
  type: string
  [key: string]: unknown
}

export interface HassResult<T = unknown> {
  id: number
  type: 'result'
  success: boolean
  result: T
  error?: { code: string; message: string }
}

export interface HassEvent {
  id: number
  type: 'event'
  event: {
    event_type: string
    data: {
      entity_id: string
      new_state: HassEntity | null
      old_state: HassEntity | null
    }
    origin: string
    time_fired: string
  }
}

// Area registry
export interface HassArea {
  area_id: string
  name: string
  icon: string | null
}

// Entity registry entry (area_id may be null even if the device has one)
export interface HassEntityRegistryEntry {
  entity_id: string
  area_id: string | null   // direct entity override — often null
  device_id: string | null
  platform: string
  disabled_by: string | null
  hidden_by: string | null
  name: string | null
  icon: string | null
}

// Device registry entry — area is usually set here, not on the entity
export interface HassDeviceRegistryEntry {
  id: string
  area_id: string | null
  name: string | null
  name_by_user: string | null
}

export interface WeatherAttributes {
  friendly_name?: string
  temperature?: number
  temperature_unit?: string
  humidity?: number
  wind_speed?: number
  wind_speed_unit?: string
  pressure?: number
  pressure_unit?: string
  visibility?: number
  visibility_unit?: string
  precipitation_unit?: string
  forecast?: WeatherForecast[]
}

export interface WeatherForecast {
  datetime: string
  condition: string
  temperature?: number
  templow?: number
  precipitation?: number
  precipitation_probability?: number
  wind_speed?: number
  wind_bearing?: number
}

export interface MediaPlayerAttributes {
  friendly_name?: string
  media_title?: string
  media_artist?: string
  media_album_name?: string
  media_content_type?: string
  media_duration?: number
  media_position?: number
  media_image_url?: string
  entity_picture?: string
  volume_level?: number          // 0.0–1.0
  is_volume_muted?: boolean
  source?: string
  source_list?: string[]
  media_player_thumbnail?: string
  supported_features?: number
  shuffle?: boolean
  repeat?: string
}

export interface CameraAttributes {
  friendly_name?: string
  access_token?: string
  entity_picture?: string
  frontend_stream_type?: string
  supported_features?: number
}

export interface CalendarAttributes {
  friendly_name?: string
  message?: string
  all_day?: boolean
  start_time?: string
  end_time?: string
  location?: string
  description?: string
}

export interface CalendarEvent {
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  description?: string
  location?: string
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'error'

export interface HAUser {
  id: string
  name: string
  is_owner: boolean
  is_active: boolean
}
