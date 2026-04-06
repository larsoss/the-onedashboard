import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import { HAClient } from '@/lib/ha-client'
import { fetchStates, fetchHAConfig } from '@/lib/ha-api'
import {
  getEntityAreaOverrides,
  setEntityAreaOverrides as persistOverrides,
  getCustomAreas,
  saveCustomAreas as persistCustomAreas,
} from '@/lib/area-storage'
import type {
  HassEntity,
  HassArea,
  HassEntityRegistryEntry,
  HassDeviceRegistryEntry,
  ConnectionStatus,
} from '@/types/ha-types'
import type { CustomArea, EntityAreaOverrides } from '@/lib/area-storage'

interface HAContextValue {
  status: ConnectionStatus
  entities: Record<string, HassEntity>
  locationName: string
  haAreas: HassArea[]
  customAreas: CustomArea[]
  entityRegistry: Record<string, HassEntityRegistryEntry>
  deviceRegistry: Record<string, HassDeviceRegistryEntry>
  entityAreaOverrides: EntityAreaOverrides
  /** Resolve the effective area for an entity:
   *  localStorage override → entity registry → device registry → null */
  resolveEntityArea: (entityId: string) => string | null
  callService: (
    domain: string,
    service: string,
    data: Record<string, unknown>,
    entityId?: string
  ) => Promise<void>
  saveEntityAreaOverrides: (overrides: EntityAreaOverrides) => void
  updateCustomAreas: (areas: CustomArea[]) => void
}

const HAContext = createContext<HAContextValue>({
  status: 'disconnected',
  entities: {},
  locationName: 'Home',
  haAreas: [],
  customAreas: [],
  entityRegistry: {},
  deviceRegistry: {},
  entityAreaOverrides: {},
  resolveEntityArea: () => null,
  callService: async () => undefined,
  saveEntityAreaOverrides: () => undefined,
  updateCustomAreas: () => undefined,
})

export function HAProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [entities, setEntities] = useState<Record<string, HassEntity>>({})
  const [locationName, setLocationName] = useState('Home')
  const [haAreas, setHaAreas] = useState<HassArea[]>([])
  const [entityRegistry, setEntityRegistry] = useState<Record<string, HassEntityRegistryEntry>>({})
  const [deviceRegistry, setDeviceRegistry] = useState<Record<string, HassDeviceRegistryEntry>>({})
  const [entityAreaOverrides, setEntityAreaOverrides] = useState<EntityAreaOverrides>(
    getEntityAreaOverrides
  )
  const [customAreas, setCustomAreas] = useState<CustomArea[]>(getCustomAreas)
  const clientRef = useRef<HAClient | null>(null)

  useEffect(() => {
    const client = new HAClient()
    clientRef.current = client

    const unsubStatus = client.onStatusChange((s) => {
      setStatus(s)
      if (s === 'connected') {
        fetchStates()
          .then((states) => {
            const map: Record<string, HassEntity> = {}
            states.forEach((e) => { map[e.entity_id] = e })
            setEntities(map)
          })
          .catch(console.error)

        fetchHAConfig()
          .then((cfg) => setLocationName(cfg.location_name))
          .catch(() => undefined)

        client.getAreas()
          .then(setHaAreas)
          .catch(console.error)

        client.getEntityRegistry()
          .then((entries) => {
            const map: Record<string, HassEntityRegistryEntry> = {}
            entries.forEach((e) => { map[e.entity_id] = e })
            setEntityRegistry(map)
          })
          .catch(console.error)

        // Device registry — needed for entity→area fallback
        client.getDeviceRegistry()
          .then((devices) => {
            const map: Record<string, HassDeviceRegistryEntry> = {}
            devices.forEach((d) => { map[d.id] = d })
            setDeviceRegistry(map)
          })
          .catch(console.error)
      }
    })

    const unsubState = client.onStateChange((entityId, newState) => {
      setEntities((prev) => {
        if (newState === null) {
          const next = { ...prev }
          delete next[entityId]
          return next
        }
        return { ...prev, [entityId]: newState }
      })
    })

    client.connect()

    return () => {
      unsubStatus()
      unsubState()
      client.disconnect()
    }
  }, [])

  const callService = useCallback(
    async (
      domain: string,
      service: string,
      data: Record<string, unknown>,
      entityId?: string
    ) => {
      await clientRef.current?.callService(domain, service, data, entityId)
    },
    []
  )

  const saveEntityAreaOverrides = useCallback((overrides: EntityAreaOverrides) => {
    persistOverrides(overrides)
    setEntityAreaOverrides(overrides)
  }, [])

  const updateCustomAreas = useCallback((areas: CustomArea[]) => {
    persistCustomAreas(areas)
    setCustomAreas(areas)
  }, [])

  // Stable resolver: override → entity.area_id → device.area_id → null
  const resolveEntityArea = useCallback(
    (entityId: string): string | null => {
      if (entityAreaOverrides[entityId] !== undefined) {
        return entityAreaOverrides[entityId]
      }
      const entry = entityRegistry[entityId]
      if (entry?.area_id) return entry.area_id
      if (entry?.device_id) {
        return deviceRegistry[entry.device_id]?.area_id ?? null
      }
      return null
    },
    [entityAreaOverrides, entityRegistry, deviceRegistry]
  )

  return (
    <HAContext.Provider
      value={{
        status,
        entities,
        locationName,
        haAreas,
        customAreas,
        entityRegistry,
        deviceRegistry,
        entityAreaOverrides,
        resolveEntityArea,
        callService,
        saveEntityAreaOverrides,
        updateCustomAreas,
      }}
    >
      {children}
    </HAContext.Provider>
  )
}

export function useHA() {
  return useContext(HAContext)
}
