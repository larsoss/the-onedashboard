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
  brightness?: number          // 0-255
  color_temp?: number
  rgb_color?: [number, number, number]
  supported_color_modes?: string[]
  supported_features?: number
  min_mireds?: number
  max_mireds?: number
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

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'error'
