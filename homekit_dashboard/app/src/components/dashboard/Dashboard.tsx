import { useState, useMemo, useRef } from 'react'
import { Header } from './Header'
import { RoomTabs } from './RoomTabs'
import { TilesGrid } from './TilesGrid'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { useHA } from '@/hooks/useHAClient'
import { getDomain } from '@/lib/utils'
import { Wifi, Activity, GripVertical, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HassEntity } from '@/types/ha-types'

const TILE_DOMAINS = new Set([
  'light', 'switch', 'input_boolean', 'climate', 'lock', 'cover', 'sensor', 'binary_sensor',
])

function ConnectingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh text-ios-secondary">
      <Wifi className="w-12 h-12 mb-4 animate-pulse" />
      <p className="text-base font-medium text-ios-label">Connecting to Home Assistant…</p>
      <p className="text-sm mt-1">This may take a moment</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-ios-secondary px-8 text-center">
      <Activity className="w-12 h-12 mb-4 opacity-40" />
      <p className="text-base font-medium">No entities here</p>
      <p className="text-sm mt-1 opacity-70">
        Add entities to areas in Home Assistant, or use Settings to assign them
      </p>
    </div>
  )
}

// ── Area section with drag handle ────────────────────────────────────────────

interface AreaSectionProps {
  areaId: string
  areaName: string
  entities: HassEntity[]
  isDragOver: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
}

function AreaSection({
  areaName, entities, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd,
}: AreaSectionProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'transition-all duration-150',
        isDragOver && 'opacity-50 scale-[0.99]'
      )}
    >
      <div className="flex items-center gap-1 px-4 pt-5 pb-2 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-ios-secondary/40 shrink-0" />
        <h2 className="text-base font-bold text-ios-label">{areaName}</h2>
        <span className="text-xs text-ios-secondary ml-1">{entities.length}</span>
      </div>
      <TilesGrid entities={entities} />
    </div>
  )
}

// ── Home View ────────────────────────────────────────────────────────────────

function HomeView({ onShowSettings }: { onShowSettings: () => void }) {
  const { haAreas, customAreas, entities, resolveEntityArea, favorites, areaOrder, saveAreaOrder } = useHA()
  const [dragAreaId, setDragAreaId] = useState<string | null>(null)
  const [dragOverAreaId, setDragOverAreaId] = useState<string | null>(null)
  const dragCounter = useRef(0)

  const allAreas = useMemo(() => [
    ...haAreas.map((a) => ({ area_id: a.area_id, name: a.name })),
    ...customAreas,
  ], [haAreas, customAreas])

  // Sort areas by saved order, unseen areas appended at end
  const sortedAreas = useMemo(() => {
    if (areaOrder.length === 0) return allAreas
    const orderMap = new Map(areaOrder.map((id, i) => [id, i]))
    return [...allAreas].sort((a, b) => {
      const ai = orderMap.get(a.area_id) ?? 9999
      const bi = orderMap.get(b.area_id) ?? 9999
      return ai - bi
    })
  }, [allAreas, areaOrder])

  const getAreaEntities = (areaId: string): HassEntity[] =>
    Object.values(entities).filter(
      (e) => TILE_DOMAINS.has(getDomain(e.entity_id)) && resolveEntityArea(e.entity_id) === areaId
    )

  const favoriteEntities = useMemo(
    () => favorites
      .map((id) => entities[id])
      .filter((e): e is HassEntity => !!e && TILE_DOMAINS.has(getDomain(e.entity_id))),
    [favorites, entities]
  )

  const unassigned = useMemo(
    () => Object.values(entities).filter(
      (e) => TILE_DOMAINS.has(getDomain(e.entity_id)) && !resolveEntityArea(e.entity_id)
    ),
    [entities, resolveEntityArea]
  )

  const areasWithEntities = sortedAreas.filter((a) => getAreaEntities(a.area_id).length > 0)

  // Drag handlers
  const handleDrop = (targetAreaId: string) => {
    if (!dragAreaId || dragAreaId === targetAreaId) return
    const ids = sortedAreas.map((a) => a.area_id)
    const from = ids.indexOf(dragAreaId)
    const to = ids.indexOf(targetAreaId)
    if (from === -1 || to === -1) return
    const newOrder = [...ids]
    newOrder.splice(from, 1)
    newOrder.splice(to, 0, dragAreaId)
    saveAreaOrder(newOrder)
    setDragAreaId(null)
    setDragOverAreaId(null)
  }

  if (areasWithEntities.length === 0 && unassigned.length === 0 && favoriteEntities.length === 0) {
    return (
      <div>
        <EmptyState />
        <div className="flex justify-center pb-8">
          <button
            onClick={onShowSettings}
            className="px-4 py-2 rounded-full bg-ios-blue/20 text-ios-blue text-sm font-medium"
          >
            Open Settings to assign entities
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Favorites */}
      {favoriteEntities.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-4 pt-5 pb-2">
            <Star className="w-4 h-4 text-ios-amber fill-ios-amber" />
            <h2 className="text-base font-bold text-ios-label">Favorites</h2>
            <span className="text-xs text-ios-secondary ml-1">{favoriteEntities.length}</span>
          </div>
          <TilesGrid entities={favoriteEntities} />
        </div>
      )}

      {/* Area sections — draggable */}
      {areasWithEntities.map((area) => (
        <AreaSection
          key={area.area_id}
          areaId={area.area_id}
          areaName={area.name}
          entities={getAreaEntities(area.area_id)}
          isDragOver={dragOverAreaId === area.area_id && dragAreaId !== area.area_id}
          onDragStart={() => {
            dragCounter.current = 0
            setDragAreaId(area.area_id)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (dragAreaId && dragAreaId !== area.area_id) {
              setDragOverAreaId(area.area_id)
            }
          }}
          onDrop={() => handleDrop(area.area_id)}
          onDragEnd={() => {
            setDragAreaId(null)
            setDragOverAreaId(null)
          }}
        />
      ))}

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <div>
          <div className="flex items-baseline gap-2 px-4 pt-5 pb-2">
            <h2 className="text-base font-bold text-ios-secondary">Other</h2>
            <span className="text-xs text-ios-secondary">{unassigned.length}</span>
          </div>
          <TilesGrid entities={unassigned} />
        </div>
      )}
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { status, entities, resolveEntityArea } = useHA()
  const [activeTab, setActiveTab] = useState('home')
  const [showSettings, setShowSettings] = useState(false)

  const filteredEntities = useMemo<HassEntity[]>(() => {
    if (activeTab === 'home') return []
    return Object.values(entities).filter(
      (e) => TILE_DOMAINS.has(getDomain(e.entity_id)) && resolveEntityArea(e.entity_id) === activeTab
    )
  }, [entities, resolveEntityArea, activeTab])

  if (status === 'connecting' || status === 'authenticating' || status === 'disconnected') {
    return <ConnectingScreen />
  }

  if (showSettings) {
    return <SettingsPanel onClose={() => setShowSettings(false)} />
  }

  return (
    <div className="min-h-dvh max-w-screen-2xl mx-auto">
      <Header onSettingsClick={() => setShowSettings(true)} />
      <RoomTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'home'
        ? <HomeView onShowSettings={() => setShowSettings(true)} />
        : filteredEntities.length > 0
          ? <TilesGrid entities={filteredEntities} className="pt-3" />
          : <EmptyState />
      }
    </div>
  )
}
