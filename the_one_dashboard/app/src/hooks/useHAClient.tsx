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
  getFavorites,
  saveFavorites,
  getAreaOrder,
  saveAreaOrder as persistAreaOrder,
} from '@/lib/area-storage'
import {
  getTheme,
  saveTheme,
  BG_VALUES,
  type ThemeConfig,
} from '@/lib/theme-storage'
import {
  getEntityIcons,
  saveEntityIcons,
  type EntityIconMap,
} from '@/lib/icon-storage'
import {
  getTileSizes,
  saveTileSizes,
  type EntityTileSizes,
  type TileSpan,
} from '@/lib/tile-sizes'
import {
  getHiddenEntities,
  saveHiddenEntities,
} from '@/lib/hidden-storage'
import {
  getEntityOrder,
  saveEntityOrder,
  type EntityOrderMap,
} from '@/lib/entity-order-storage'
import type {
  HassEntity,
  HassArea,
  HassEntityRegistryEntry,
  HassDeviceRegistryEntry,
  ConnectionStatus,
  HAUser,
} from '@/types/ha-types'
import type { CustomArea, EntityAreaOverrides } from '@/lib/area-storage'
import { getStoredUserId, storeUserId } from '@/components/dashboard/UserPicker'
import { setCurrentUserId, scheduleSyncToServer } from '@/lib/user-context'
import { loadServerSettings, applyServerSettings } from '@/lib/settings-sync'
import { setLocale } from '@/lib/i18n'

interface HAContextValue {
  status: ConnectionStatus
  entities: Record<string, HassEntity>
  locationName: string
  haAreas: HassArea[]
  haUsers: HAUser[]
  currentUserId: string | null
  selectUser: (userId: string) => Promise<void>
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
  // Theme
  theme: ThemeConfig
  setTheme: (t: ThemeConfig) => void
  // Entity icon overrides
  entityIcons: EntityIconMap
  saveEntityIcon: (entityId: string, iconName: string | null) => void
  // Favorites
  favorites: string[]
  toggleFavorite: (entityId: string) => void
  // Area display order
  areaOrder: string[]
  saveAreaOrder: (order: string[]) => void
  // Edit mode
  isEditMode: boolean
  toggleEditMode: () => void
  entityTileSizes: EntityTileSizes
  setEntityTileSize: (entityId: string, span: TileSpan) => void
  // Hidden entities (dashboard-only)
  hiddenEntities: string[]
  toggleHideEntity: (entityId: string) => void
  // Entity order per area/context
  entityOrder: EntityOrderMap
  setContextEntityOrder: (contextId: string, order: string[]) => void
}

const HAContext = createContext<HAContextValue>({
  status: 'disconnected',
  entities: {},
  locationName: 'Home',
  haAreas: [],
  haUsers: [],
  currentUserId: null,
  selectUser: async () => undefined,
  customAreas: [],
  entityRegistry: {},
  deviceRegistry: {},
  entityAreaOverrides: {},
  resolveEntityArea: () => null,
  callService: async () => undefined,
  saveEntityAreaOverrides: () => undefined,
  updateCustomAreas: () => undefined,
  theme: getTheme(),
  setTheme: () => undefined,
  entityIcons: {},
  saveEntityIcon: () => undefined,
  favorites: [],
  toggleFavorite: () => undefined,
  areaOrder: [],
  saveAreaOrder: () => undefined,
  isEditMode: false,
  toggleEditMode: () => undefined,
  entityTileSizes: {},
  setEntityTileSize: () => undefined,
  hiddenEntities: [],
  toggleHideEntity: () => undefined,
  entityOrder: {},
  setContextEntityOrder: () => undefined,
})

export function HAProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [entities, setEntities] = useState<Record<string, HassEntity>>({})
  const [locationName, setLocationName] = useState('Home')
  const [haAreas, setHaAreas] = useState<HassArea[]>([])
  const [haUsers, setHaUsers] = useState<HAUser[]>([])
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null)
  const [entityRegistry, setEntityRegistry] = useState<Record<string, HassEntityRegistryEntry>>({})
  const [deviceRegistry, setDeviceRegistry] = useState<Record<string, HassDeviceRegistryEntry>>({})
  const [entityAreaOverrides, setEntityAreaOverrides] = useState<EntityAreaOverrides>(
    getEntityAreaOverrides
  )
  const [customAreas, setCustomAreas] = useState<CustomArea[]>(getCustomAreas)
  const [theme, setThemeState] = useState<ThemeConfig>(getTheme)
  const [entityIcons, setEntityIcons] = useState<EntityIconMap>(getEntityIcons)
  const [favorites, setFavoritesState] = useState<string[]>(getFavorites)
  const [areaOrder, setAreaOrderState] = useState<string[]>(getAreaOrder)
  const [isEditMode, setIsEditMode] = useState(false)
  const [entityTileSizes, setEntityTileSizesState] = useState<EntityTileSizes>(getTileSizes)
  const [hiddenEntities, setHiddenEntitiesState] = useState<string[]>(getHiddenEntities)
  const [entityOrder, setEntityOrderState] = useState<EntityOrderMap>(getEntityOrder)
  const clientRef = useRef<HAClient | null>(null)

  // Apply background CSS variable whenever bgStyle changes
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-bg', BG_VALUES[theme.bgStyle])
  }, [theme.bgStyle])

  // Apply initial background on mount
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-bg', BG_VALUES[getTheme().bgStyle])
  }, [])

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
          .then((cfg) => {
            setLocationName(cfg.location_name)
            if (cfg.language) setLocale(cfg.language)
          })
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

        client.getUsers()
          .then(setHaUsers)
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
    scheduleSyncToServer()
  }, [])

  const updateCustomAreas = useCallback((areas: CustomArea[]) => {
    persistCustomAreas(areas)
    setCustomAreas(areas)
    scheduleSyncToServer()
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

  const setTheme = useCallback((t: ThemeConfig) => {
    saveTheme(t)
    setThemeState(t)
    document.documentElement.style.setProperty('--theme-bg', BG_VALUES[t.bgStyle])
    scheduleSyncToServer()
  }, [])

  const toggleFavorite = useCallback((entityId: string) => {
    setFavoritesState((prev) => {
      const next = prev.includes(entityId)
        ? prev.filter((id) => id !== entityId)
        : [...prev, entityId]
      saveFavorites(next)
      scheduleSyncToServer()
      return next
    })
  }, [])

  const saveAreaOrderCb = useCallback((order: string[]) => {
    persistAreaOrder(order)
    setAreaOrderState(order)
    scheduleSyncToServer()
  }, [])

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev)
  }, [])

  const toggleHideEntity = useCallback((entityId: string) => {
    setHiddenEntitiesState((prev) => {
      const next = prev.includes(entityId)
        ? prev.filter((id) => id !== entityId)
        : [...prev, entityId]
      saveHiddenEntities(next)
      scheduleSyncToServer()
      return next
    })
  }, [])

  const setContextEntityOrder = useCallback((contextId: string, order: string[]) => {
    setEntityOrderState((prev) => {
      const next = { ...prev, [contextId]: order }
      saveEntityOrder(next)
      scheduleSyncToServer()
      return next
    })
  }, [])

  const setEntityTileSize = useCallback((entityId: string, span: TileSpan) => {
    setEntityTileSizesState((prev) => {
      const next = { ...prev, [entityId]: span }
      saveTileSizes(next)
      scheduleSyncToServer()
      return next
    })
  }, [])

  const saveEntityIcon = useCallback((entityId: string, iconName: string | null) => {
    setEntityIcons((prev) => {
      const next = { ...prev }
      if (iconName === null) {
        delete next[entityId]
      } else {
        next[entityId] = iconName
      }
      saveEntityIcons(next)
      scheduleSyncToServer()
      return next
    })
  }, [])

  const selectUser = useCallback(async (userId: string) => {
    setCurrentUserId(userId)
    storeUserId(userId)
    setCurrentUserIdState(userId)
    // Load from server
    const serverSettings = await loadServerSettings(userId)
    if (serverSettings) {
      applyServerSettings(serverSettings)
    }
    // Reload all state from (now-updated) localStorage
    setThemeState(getTheme())
    setFavoritesState(getFavorites())
    setAreaOrderState(getAreaOrder())
    setEntityIcons(getEntityIcons())
    setEntityTileSizesState(getTileSizes())
    setHiddenEntitiesState(getHiddenEntities())
    setEntityOrderState(getEntityOrder())
    setEntityAreaOverrides(getEntityAreaOverrides())
    setCustomAreas(getCustomAreas())
  }, [])

  // Auto-detect logged-in HA user via ingress header, fall back to stored ID
  useEffect(() => {
    fetch('/dashboard-api/whoami')
      .then(r => r.json())
      .then(({ userId }: { userId: string | null }) => {
        const id = userId || getStoredUserId()
        if (id) selectUser(id).catch(console.error)
      })
      .catch(() => {
        const storedId = getStoredUserId()
        if (storedId) selectUser(storedId).catch(console.error)
      })
  }, [selectUser])

  return (
    <HAContext.Provider
      value={{
        status,
        entities,
        locationName,
        haAreas,
        haUsers,
        currentUserId,
        selectUser,
        customAreas,
        entityRegistry,
        deviceRegistry,
        entityAreaOverrides,
        resolveEntityArea,
        callService,
        saveEntityAreaOverrides,
        updateCustomAreas,
        theme,
        setTheme,
        entityIcons,
        saveEntityIcon,
        favorites,
        toggleFavorite,
        areaOrder,
        saveAreaOrder: saveAreaOrderCb,
        isEditMode,
        toggleEditMode,
        entityTileSizes,
        setEntityTileSize,
        hiddenEntities,
        toggleHideEntity,
        entityOrder,
        setContextEntityOrder,
      }}
    >
      {children}
    </HAContext.Provider>
  )
}

export function useHA() {
  return useContext(HAContext)
}
