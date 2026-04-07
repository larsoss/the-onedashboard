import { useState, useMemo, useRef } from 'react'
import { Header } from './Header'
import { RoomTabs } from './RoomTabs'
import { TilesGrid } from './TilesGrid'
import { Sidebar } from './Sidebar'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { UserPicker } from './UserPicker'
import { useHA } from '@/hooks/useHAClient'
import { getDomain } from '@/lib/utils'
import { GRID_COLS } from '@/lib/theme-storage'
import { SPAN_CLASSES, type TileSpan } from '@/lib/tile-sizes'
import {
  Wifi, Activity, GripVertical, Star,
  Home, Sofa, BedDouble, ChefHat, Bath, Car, Flower2, Tv, Dumbbell,
  Lightbulb, Thermometer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HassEntity } from '@/types/ha-types'
import type { LucideIcon } from 'lucide-react'

const SPAN_OPTIONS: { span: TileSpan; label: string }[] = [
  { span: '1x1', label: '1×1' },
  { span: '2x1', label: '2×1' },
  { span: '1x2', label: '1×2' },
  { span: '2x2', label: '2×2' },
]

const TILE_DOMAINS = new Set([
  'light', 'switch', 'input_boolean', 'climate', 'lock', 'cover', 'sensor', 'binary_sensor', 'person',
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

// ── Area icon by name keyword ─────────────────────────────────────────────────

function getAreaIcon(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (/slaap|bed|kamer/.test(n) && /slaap|bed/.test(n)) return BedDouble
  if (/woon|living|lounge|salon/.test(n)) return Sofa
  if (/keuken|kitchen|cook/.test(n)) return ChefHat
  if (/bad|bath|toilet|wc/.test(n)) return Bath
  if (/garage|car|auto/.test(n)) return Car
  if (/tuin|garden|buiten|outdoor/.test(n)) return Flower2
  if (/tv|media|cinema|film/.test(n)) return Tv
  if (/gym|sport|fitness/.test(n)) return Dumbbell
  return Home
}

// ── Area Card ─────────────────────────────────────────────────────────────────

interface AreaCardProps {
  areaId: string
  areaName: string
  entities: HassEntity[]
  isDragOver: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
  onClick: () => void
}

function AreaCard({
  areaId, areaName, entities, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd, onClick,
}: AreaCardProps) {
  const { theme, isEditMode, entityTileSizes, setEntityTileSize } = useHA()
  const isGlass = theme.tileStyle === 'glass'
  const opacity = theme.tileOpacity / 100
  const span = entityTileSizes[areaId] ?? '1x1'

  const lightsOn = entities.filter(
    (e) => getDomain(e.entity_id) === 'light' && e.state === 'on'
  ).length
  const switchesOn = entities.filter(
    (e) => ['switch', 'input_boolean'].includes(getDomain(e.entity_id)) && e.state === 'on'
  ).length
  const activeCount = lightsOn + switchesOn

  // Temperature: first climate or temp sensor
  const tempEntity = entities.find((e) => {
    const d = getDomain(e.entity_id)
    if (d === 'climate') return true
    if (d === 'sensor') {
      const attr = e.attributes as Record<string, unknown>
      return attr.device_class === 'temperature' || e.entity_id.includes('temp')
    }
    return false
  })
  const tempLabel = tempEntity
    ? getDomain(tempEntity.entity_id) === 'climate'
      ? String((tempEntity.attributes as Record<string, unknown>).current_temperature ?? tempEntity.state)
      : tempEntity.state
    : null
  const tempUnit = tempEntity
    ? String((tempEntity.attributes as Record<string, unknown>).unit_of_measurement ?? '°')
    : null

  const hasActivity = activeCount > 0
  const AreaIcon = getAreaIcon(areaName)

  const bgStyle: React.CSSProperties = isGlass
    ? hasActivity
      ? {
          background: `rgba(255,159,10,${0.18 * opacity})`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid rgba(255,255,255,${0.18 * opacity})`,
        }
      : {
          background: `rgba(255,255,255,${0.06 * opacity})`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid rgba(255,255,255,${0.10 * opacity})`,
        }
    : hasActivity
      ? { background: `rgba(255,159,10,${0.18 * opacity})` }
      : { background: `rgba(44,44,46,${opacity})` }

  return (
    <div
      draggable={isEditMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={() => { if (!isEditMode) onClick() }}
      className={cn(
        'relative rounded-2xl p-3 sm:p-4 flex flex-col justify-between aspect-square',
        'cursor-pointer select-none transition-all duration-150',
        !isEditMode && 'active:scale-95',
        isDragOver && 'ring-2 ring-ios-blue ring-offset-1 ring-offset-transparent opacity-60',
        SPAN_CLASSES[span],
      )}
      style={bgStyle}
    >
      {/* Top row: icon + drag handle */}
      <div className="flex items-start justify-between">
        <AreaIcon className={cn(
          'w-6 h-6',
          hasActivity ? 'text-ios-amber' : 'text-ios-secondary'
        )} />
        {isEditMode && (
          <GripVertical className="w-4 h-4 text-white/50 cursor-grab active:cursor-grabbing" />
        )}
      </div>

      {/* Middle: activity badges */}
      <div className="flex flex-wrap gap-1 my-1">
        {lightsOn > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-ios-amber font-medium">
            <Lightbulb className="w-3 h-3" />{lightsOn}
          </span>
        )}
        {tempLabel && (
          <span className="flex items-center gap-0.5 text-[10px] text-ios-secondary font-medium">
            <Thermometer className="w-3 h-3" />{tempLabel}{tempUnit}
          </span>
        )}
      </div>

      {/* Bottom: name + count */}
      <div>
        <p className={cn(
          'text-sm font-semibold leading-tight truncate',
          hasActivity ? 'text-ios-label' : 'text-ios-secondary'
        )}>
          {areaName}
        </p>
        <p className="text-xs text-ios-secondary mt-0.5">
          {entities.length} {entities.length === 1 ? 'device' : 'devices'}
          {activeCount > 0 && ` · ${activeCount} on`}
        </p>
      </div>

      {/* Edit mode overlay */}
      {isEditMode && (
        <div className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-1.5 bg-black/50 backdrop-blur-[2px]">
          <div className="flex flex-wrap gap-1 justify-center px-2">
            {SPAN_OPTIONS.map(({ span: s, label }) => (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); setEntityTileSize(areaId, s) }}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-medium transition-all',
                  span === s ? 'bg-ios-blue text-white' : 'bg-white/20 text-white hover:bg-white/30'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Home View ────────────────────────────────────────────────────────────────

interface HomeViewProps {
  onShowSettings: () => void
  onTabChange: (tabId: string) => void
}

function HomeView({ onShowSettings, onTabChange }: HomeViewProps) {
  const { haAreas, customAreas, entities, resolveEntityArea, favorites, areaOrder, saveAreaOrder, theme } = useHA()
  const [dragAreaId, setDragAreaId] = useState<string | null>(null)
  const [dragOverAreaId, setDragOverAreaId] = useState<string | null>(null)
  const dragCounter = useRef(0)

  const allAreas = useMemo(() => [
    ...haAreas.map((a) => ({ area_id: a.area_id, name: a.name })),
    ...customAreas,
  ], [haAreas, customAreas])

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

  // Person entities always shown on Home, regardless of area assignment
  const personEntities = useMemo(
    () => Object.values(entities).filter((e) => getDomain(e.entity_id) === 'person'),
    [entities]
  )

  const areasWithEntities = sortedAreas.filter((a) => getAreaEntities(a.area_id).length > 0)

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

  if (areasWithEntities.length === 0 && favoriteEntities.length === 0 && personEntities.length === 0) {
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
          <TilesGrid entities={favoriteEntities} contextId="favorites" />
        </div>
      )}

      {/* People */}
      {personEntities.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-4 pt-5 pb-2">
            <Home className="w-4 h-4 text-ios-blue" />
            <h2 className="text-base font-bold text-ios-label">People</h2>
            <span className="text-xs text-ios-secondary ml-1">{personEntities.length}</span>
          </div>
          <TilesGrid entities={personEntities} contextId="people" />
        </div>
      )}

      {/* Area cards grid */}
      {areasWithEntities.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-4 pt-5 pb-2">
            <Home className="w-4 h-4 text-ios-secondary" />
            <h2 className="text-base font-bold text-ios-label">Rooms</h2>
          </div>
          <div className={cn('grid gap-2 sm:gap-3 px-4', GRID_COLS[theme.tileSize])}>
            {areasWithEntities.map((area) => (
              <AreaCard
                key={area.area_id}
                areaId={area.area_id}
                areaName={area.name}
                entities={getAreaEntities(area.area_id)}
                isDragOver={dragOverAreaId === area.area_id && dragAreaId !== area.area_id}
                onClick={() => onTabChange(area.area_id)}
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
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { status, entities, resolveEntityArea, currentUserId, haUsers, selectUser } = useHA()

  // Read URL query params once on mount
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), [])
  const initialView = searchParams.get('view') ?? 'home'
  const hideMenu = searchParams.get('menu') === 'false'

  const [activeTab, setActiveTab] = useState(initialView)
  const [showSettings, setShowSettings] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    <div className="flex min-h-dvh max-w-screen-2xl mx-auto">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={(tab) => { setActiveTab(tab); setSidebarOpen(false) }}
      />
      <div className="flex-1 min-w-0">
        {/* Fallback picker: shown only when ingress auto-detection failed and there are multiple users */}
        {status === 'connected' && currentUserId === null && haUsers.length > 1 && (
          <UserPicker users={haUsers} onSelect={selectUser} />
        )}
        <Header
          onSettingsClick={() => setShowSettings(true)}
          onSidebarToggle={() => setSidebarOpen((v) => !v)}
        />
        {!hideMenu && <RoomTabs activeTab={activeTab} onTabChange={setActiveTab} />}
        {activeTab === 'home'
          ? <HomeView onShowSettings={() => setShowSettings(true)} onTabChange={setActiveTab} />
          : filteredEntities.length > 0
            ? <TilesGrid entities={filteredEntities} contextId={activeTab} className="pt-3" />
            : <EmptyState />
        }
      </div>
    </div>
  )
}
