import { useState, useMemo } from 'react'
import { Header } from './Header'
import { RoomTabs } from './RoomTabs'
import { TilesGrid } from './TilesGrid'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { useHA } from '@/hooks/useHAClient'
import { getDomain } from '@/lib/utils'
import { Wifi } from 'lucide-react'
import type { HassEntity } from '@/types/ha-types'

const TILE_DOMAINS = new Set([
  'light', 'switch', 'input_boolean', 'climate', 'lock', 'cover', 'sensor', 'binary_sensor',
])

function ConnectingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-ios-secondary">
      <Wifi className="w-12 h-12 mb-4 animate-pulse" />
      <p className="text-base font-medium text-ios-label">Connecting to Home Assistant…</p>
      <p className="text-sm mt-1">This may take a moment</p>
    </div>
  )
}

export function Dashboard() {
  const { status, entities, entityRegistry, entityAreaOverrides } = useHA()
  const [activeTab, setActiveTab] = useState('all')
  const [showSettings, setShowSettings] = useState(false)

  // Filter entities for the active tab
  const filteredEntities = useMemo<HassEntity[]>(() => {
    const all = Object.values(entities).filter((e) => TILE_DOMAINS.has(getDomain(e.entity_id)))
    if (activeTab === 'all') return all

    return all.filter((e) => {
      const override = entityAreaOverrides[e.entity_id]
      const areaId = override !== undefined
        ? override
        : (entityRegistry[e.entity_id]?.area_id ?? null)
      return areaId === activeTab
    })
  }, [entities, entityRegistry, entityAreaOverrides, activeTab])

  if (status === 'connecting' || status === 'authenticating' || status === 'disconnected') {
    return <ConnectingScreen />
  }

  if (showSettings) {
    return <SettingsPanel onClose={() => setShowSettings(false)} />
  }

  return (
    <div className="min-h-screen bg-ios-bg">
      <Header onSettingsClick={() => setShowSettings(true)} />
      <RoomTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <TilesGrid entities={filteredEntities} />
    </div>
  )
}
