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
import type { HassEntity, ConnectionStatus } from '@/types/ha-types'

interface HAContextValue {
  status: ConnectionStatus
  entities: Record<string, HassEntity>
  locationName: string
  callService: (
    domain: string,
    service: string,
    data: Record<string, unknown>,
    entityId?: string
  ) => Promise<void>
}

const HAContext = createContext<HAContextValue>({
  status: 'disconnected',
  entities: {},
  locationName: 'Home',
  callService: async () => undefined,
})

export function HAProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [entities, setEntities] = useState<Record<string, HassEntity>>({})
  const [locationName, setLocationName] = useState('Home')
  const clientRef = useRef<HAClient | null>(null)

  useEffect(() => {
    const client = new HAClient()
    clientRef.current = client

    const unsubStatus = client.onStatusChange((s) => {
      setStatus(s)
      if (s === 'connected') {
        // Fetch initial entity states and HA config via REST
        fetchStates()
          .then((states) => {
            const map: Record<string, HassEntity> = {}
            states.forEach((e) => {
              map[e.entity_id] = e
            })
            setEntities(map)
          })
          .catch(console.error)

        fetchHAConfig()
          .then((cfg) => setLocationName(cfg.location_name))
          .catch(() => undefined)
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

  return (
    <HAContext.Provider value={{ status, entities, locationName, callService }}>
      {children}
    </HAContext.Provider>
  )
}

export function useHA() {
  return useContext(HAContext)
}
