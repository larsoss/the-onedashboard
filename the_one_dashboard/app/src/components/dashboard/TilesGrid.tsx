import { useState, useRef, useCallback } from 'react'
import type { HassEntity } from '@/types/ha-types'
import { getDomain } from '@/lib/utils'
import { LightTile } from '@/components/tiles/LightTile'
import { SwitchTile } from '@/components/tiles/SwitchTile'
import { ThermostatTile } from '@/components/tiles/ThermostatTile'
import { LockTile } from '@/components/tiles/LockTile'
import { CoverTile } from '@/components/tiles/CoverTile'
import { SensorTile } from '@/components/tiles/SensorTile'
import { PersonTile } from '@/components/tiles/PersonTile'
import { SceneTile } from '@/components/tiles/SceneTile'
import { AutomationTile } from '@/components/tiles/AutomationTile'
import { ScriptTile } from '@/components/tiles/ScriptTile'
import { WeatherTile } from '@/components/tiles/WeatherTile'
import { MediaPlayerTile } from '@/components/tiles/MediaPlayerTile'
import { CameraTile } from '@/components/tiles/CameraTile'
import { CalendarTile } from '@/components/tiles/CalendarTile'
import { BaseTile } from '@/components/tiles/BaseTile'
import { useHA } from '@/hooks/useHAClient'
import { GRID_COLS } from '@/lib/theme-storage'
import { SPAN_CLASSES, type TileSpan } from '@/lib/tile-sizes'
import { ICON_OPTIONS } from '@/lib/icons'
import { Activity, EyeOff, X, Heart, GripVertical, GripHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUPPORTED_DOMAINS = new Set([
  'light', 'switch', 'input_boolean', 'climate', 'lock', 'cover',
  'sensor', 'binary_sensor', 'person',
  'scene', 'automation', 'script', 'weather',
  'media_player', 'camera', 'calendar',
])

// Domains that should be hidden when their entity is inactive (not in edit mode)
const HIDE_WHEN_INACTIVE = new Set(['media_player'])


function Tile({ entity }: { entity: HassEntity }) {
  const domain = getDomain(entity.entity_id)
  switch (domain) {
    case 'light':         return <LightTile entityId={entity.entity_id} />
    case 'switch':
    case 'input_boolean': return <SwitchTile entityId={entity.entity_id} />
    case 'climate':       return <ThermostatTile entityId={entity.entity_id} />
    case 'lock':          return <LockTile entityId={entity.entity_id} />
    case 'cover':         return <CoverTile entityId={entity.entity_id} />
    case 'sensor':
    case 'binary_sensor': return <SensorTile entityId={entity.entity_id} />
    case 'person':        return <PersonTile entityId={entity.entity_id} />
    case 'scene':         return <SceneTile entityId={entity.entity_id} />
    case 'automation':    return <AutomationTile entityId={entity.entity_id} />
    case 'script':        return <ScriptTile entityId={entity.entity_id} />
    case 'weather':       return <WeatherTile entityId={entity.entity_id} />
    case 'media_player':  return <MediaPlayerTile entityId={entity.entity_id} />
    case 'camera':        return <CameraTile entityId={entity.entity_id} />
    case 'calendar':      return <CalendarTile entityId={entity.entity_id} />
    default:
      return (
        <BaseTile
          icon={<Activity className="w-full h-full" />}
          label={entity.entity_id}
          sublabel={entity.state}
        />
      )
  }
}

interface IconPickerProps {
  entityId: string
  onClose: () => void
}

function IconPicker({ entityId, onClose }: IconPickerProps) {
  const { entityIcons, saveEntityIcon } = useHA()
  const current = entityIcons[entityId]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      <div
        className="bg-ios-card rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-sm max-h-[60dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-ios-label">Choose Icon</p>
          <button onClick={onClose}><X className="w-4 h-4 text-ios-secondary" /></button>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {ICON_OPTIONS.map((opt) => {
            const IconComp = opt.icon
            return (
              <button
                key={opt.name}
                onClick={() => { saveEntityIcon(entityId, opt.name); onClose() }}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                  current === opt.name
                    ? 'bg-ios-blue/20 text-ios-blue'
                    : 'text-ios-secondary hover:bg-ios-card-2'
                )}
                title={opt.label}
              >
                <IconComp className="w-5 h-5" />
                <span className="text-[9px] leading-tight truncate w-full text-center">{opt.label}</span>
              </button>
            )
          })}
        </div>
        {current && (
          <button
            onClick={() => { saveEntityIcon(entityId, null); onClose() }}
            className="mt-3 w-full py-2 rounded-xl text-xs text-ios-secondary bg-ios-card-2"
          >
            Reset to default
          </button>
        )}
      </div>
    </div>
  )
}

// Snap span based on drag delta relative to one tile cell size
function snapSpan(current: TileSpan, dx: number, dy: number, cellW: number, cellH: number): TileSpan {
  const [c, r] = current.split('x').map(Number)
  const newC = dx > cellW * 0.45 ? 2 : dx < -cellW * 0.45 ? 1 : c
  const newR = dy > cellH * 0.45 ? 2 : dy < -cellH * 0.45 ? 1 : r
  return `${newC}x${newR}` as TileSpan
}

interface EditOverlayProps {
  entityId: string
  tileRef: React.RefObject<HTMLDivElement>
}

function EditOverlay({ entityId, tileRef }: EditOverlayProps) {
  const { entityTileSizes, setEntityTileSize, toggleHideEntity, toggleFavorite, favorites } = useHA()
  const [showIconPicker, setShowIconPicker] = useState(false)
  const current = entityTileSizes[entityId] ?? '1x1'
  const isFavorited = favorites.includes(entityId)

  // Resize handle state
  const dragStart = useRef<{ x: number; y: number; span: TileSpan; cellW: number; cellH: number } | null>(null)
  const [previewSpan, setPreviewSpan] = useState<TileSpan | null>(null)

  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const el = tileRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    // Cell size = current rendered tile size ÷ current span columns/rows
    const [c, r] = current.split('x').map(Number)
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      span: current,
      cellW: rect.width / c,
      cellH: rect.height / r,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [current, tileRef])

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return
    const { x, y, span, cellW, cellH } = dragStart.current
    const dx = e.clientX - x
    const dy = e.clientY - y
    setPreviewSpan(snapSpan(span, dx, dy, cellW, cellH))
  }, [])

  const onResizePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return
    const { x, y, span, cellW, cellH } = dragStart.current
    const dx = e.clientX - x
    const dy = e.clientY - y
    const newSpan = snapSpan(span, dx, dy, cellW, cellH)
    setEntityTileSize(entityId, newSpan)
    dragStart.current = null
    setPreviewSpan(null)
  }, [entityId, setEntityTileSize])

  const displaySpan = previewSpan ?? current

  return (
    <>
      <div className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-[2px] pointer-events-none">
        {/* Drag-reorder handle (top center) */}
        <div className="pointer-events-auto absolute top-2 left-1/2 -translate-x-1/2 cursor-grab">
          <GripVertical className="w-4 h-4 text-white/60" />
        </div>

        {/* Current size indicator */}
        <span className="text-[10px] text-white/50 font-mono absolute top-2 right-2">{displaySpan}</span>

        {/* Icon + Heart + Hide buttons */}
        <div className="flex gap-1.5 pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); setShowIconPicker(true) }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/20 text-white hover:bg-white/30"
          >
            Icon
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(entityId) }}
            className="px-2 py-1.5 rounded-lg text-xs font-medium bg-white/20 text-white hover:bg-white/30 flex items-center gap-1"
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={cn('w-3 h-3', isFavorited ? 'fill-ios-red text-ios-red' : '')} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleHideEntity(entityId) }}
            className="px-2 py-1.5 rounded-lg text-xs font-medium bg-red-500/60 text-white hover:bg-red-500/80 flex items-center gap-1"
            title="Hide from dashboard"
          >
            <EyeOff className="w-3 h-3" />
          </button>
        </div>

        {/* Resize handle — bottom-right corner */}
        <div
          className={cn(
            'pointer-events-auto absolute bottom-1.5 right-1.5 cursor-nwse-resize',
            'w-6 h-6 rounded-lg flex items-center justify-center',
            'bg-white/20 hover:bg-white/40 transition-colors',
            previewSpan && previewSpan !== current && 'bg-ios-blue/60',
          )}
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          title="Sleep om te resizen"
        >
          <GripHorizontal className="w-3.5 h-3.5 text-white rotate-45" />
        </div>
      </div>
      {showIconPicker && (
        <IconPicker entityId={entityId} onClose={() => setShowIconPicker(false)} />
      )}
    </>
  )
}

// Per-tile wrapper with its own ref so EditOverlay can measure the tile for resize
interface TileWrapperProps {
  entity: HassEntity
  span: TileSpan
  isEditMode: boolean
  isDragging: boolean
  isDragOver: boolean
  isFavorited: boolean
  contextId?: string
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
}

function TileWrapper({ entity, span, isEditMode, isDragging, isDragOver, isFavorited, contextId, onDragStart, onDragOver, onDrop, onDragEnd }: TileWrapperProps) {
  const tileRef = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={tileRef}
      draggable={isEditMode && !!contextId}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'relative transition-all duration-150',
        SPAN_CLASSES[span],
        isDragging && 'opacity-40 scale-95',
        isDragOver && 'ring-2 ring-ios-blue ring-offset-1 ring-offset-transparent rounded-2xl',
      )}
    >
      <Tile entity={entity} />
      {isEditMode && <EditOverlay entityId={entity.entity_id} tileRef={tileRef} />}
      {!isEditMode && isFavorited && (
        <Heart className="w-3 h-3 fill-red-400 text-red-400 absolute top-1.5 right-1.5 z-5 pointer-events-none" />
      )}
    </div>
  )
}

interface TilesGridProps {
  entities: HassEntity[]
  contextId?: string
  className?: string
}

export function TilesGrid({ entities, contextId, className }: TilesGridProps) {
  const { theme, isEditMode, entityTileSizes, hiddenEntities, entityOrder, setContextEntityOrder, favorites } = useHA()
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // Filter hidden + unsupported + inactive conditional domains (e.g. media_player when idle)
  const base = entities.filter((e) => {
    const domain = getDomain(e.entity_id)
    if (!SUPPORTED_DOMAINS.has(domain)) return false
    if (hiddenEntities.includes(e.entity_id)) return false
    // Hide media_players when idle/off unless in edit mode
    if (!isEditMode && HIDE_WHEN_INACTIVE.has(domain)) {
      const inactive = ['idle', 'off', 'unavailable', 'unknown']
      if (inactive.includes(e.state)) return false
    }
    return true
  })

  // Apply stored order for this context
  const ordered = (() => {
    if (!contextId) return base
    const order = entityOrder[contextId]
    if (!order || order.length === 0) return base
    const map = new Map(base.map((e) => [e.entity_id, e]))
    const sorted: HassEntity[] = []
    order.forEach((id) => { const e = map.get(id); if (e) sorted.push(e) })
    // Append any new entities not yet in saved order
    base.forEach((e) => { if (!order.includes(e.entity_id)) sorted.push(e) })
    return sorted
  })()

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId || !contextId) return
    const ids = ordered.map((e) => e.entity_id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    if (from === -1 || to === -1) return
    const newOrder = [...ids]
    newOrder.splice(from, 1)
    newOrder.splice(to, 0, dragId)
    setContextEntityOrder(contextId, newOrder)
    setDragId(null)
    setDragOverId(null)
  }

  if (ordered.length === 0) return null

  return (
    <div className={cn('grid gap-2 sm:gap-3 px-4', GRID_COLS[theme.tileSize], className)}>
      {ordered.map((entity) => {
        const defaultSpan = getDomain(entity.entity_id) === 'person' ? '2x1' : '1x1'
        const span = entityTileSizes[entity.entity_id] ?? defaultSpan
        const isDragging = dragId === entity.entity_id
        const isDragOver = dragOverId === entity.entity_id && dragId !== entity.entity_id
        return (
          <TileWrapper
            key={entity.entity_id}
            entity={entity}
            span={span}
            isEditMode={isEditMode}
            isDragging={isDragging}
            isDragOver={isDragOver}
            isFavorited={favorites.includes(entity.entity_id)}
            contextId={contextId}
            onDragStart={() => setDragId(entity.entity_id)}
            onDragOver={(e) => { e.preventDefault(); if (dragId) setDragOverId(entity.entity_id) }}
            onDrop={() => handleDrop(entity.entity_id)}
            onDragEnd={() => { setDragId(null); setDragOverId(null) }}
          />
        )
      })}
    </div>
  )
}
