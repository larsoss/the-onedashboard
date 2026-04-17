import { useState, useRef, useCallback } from 'react'
import type { HassEntity } from '@/types/ha-types'
import { getDomain, entityLabel } from '@/lib/utils'
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
import { GRID_COLS, TILE_ROW_H } from '@/lib/theme-storage'
import { SPAN_CLASSES, spanToUnits, unitsToSpan, type TileSpan } from '@/lib/tile-sizes'
import { ICON_OPTIONS } from '@/lib/icons'
import { Activity, EyeOff, X, Heart, GripVertical, GripHorizontal, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

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
          <p className="text-sm font-semibold text-ios-label">{t('choose_icon')}</p>
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
            {t('reset')}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Compute a new TileSpan based on drag delta.
 * tileW/tileH = full rendered size of the tile before drag started.
 * Drag right > 40% of tile width  → step wider
 * Drag left  > 25% of tile width  → step narrower
 * Drag down  > 40% of tile height → step taller
 * Drag up    > 25% of tile height → step shorter
 */
function snapSpan(current: TileSpan, dx: number, dy: number, tileW: number, tileH: number): TileSpan {
  const [cu, ru] = spanToUnits(current)
  let newCu = cu
  let newRu = ru

  if      (dx >  tileW * 0.40) newCu = cu < 4 ? (cu <= 1 ? 2 : 4) : 4
  else if (dx < -tileW * 0.25) newCu = cu > 1 ? (cu >= 4 ? 2 : 1) : 1

  if      (dy >  tileH * 0.40) newRu = 2
  else if (dy < -tileH * 0.25) newRu = 1

  return unitsToSpan(newCu, newRu)
}

interface EditOverlayProps {
  entityId: string
  tileRef: React.RefObject<HTMLDivElement>
  currentSpan: TileSpan
  onPreviewChange: (span: TileSpan | null) => void
}

function EditOverlay({ entityId, tileRef, currentSpan, onPreviewChange }: EditOverlayProps) {
  const { entityTileSizes, setEntityTileSize, toggleHideEntity, toggleFavorite, favorites, entities, entityLabels } = useHA()
  const [showIconPicker, setShowIconPicker] = useState(false)
  const current = entityTileSizes[entityId] ?? '1x1'
  const isFavorited = favorites.includes(entityId)

  // Resize handle state
  const dragStart = useRef<{ x: number; y: number; span: TileSpan; cellW: number; cellH: number } | null>(null)

  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const el = tileRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    // Pass full rendered tile dimensions; snapSpan uses these for threshold calc
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      span: current,
      cellW: rect.width,
      cellH: rect.height,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [current, tileRef])

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return
    const { x, y, span, cellW, cellH } = dragStart.current
    const dx = e.clientX - x
    const dy = e.clientY - y
    onPreviewChange(snapSpan(span, dx, dy, cellW, cellH))
  }, [onPreviewChange])

  const onResizePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return
    const { x, y, span, cellW, cellH } = dragStart.current
    const dx = e.clientX - x
    const dy = e.clientY - y
    const newSpan = snapSpan(span, dx, dy, cellW, cellH)
    setEntityTileSize(entityId, newSpan)
    dragStart.current = null
    onPreviewChange(null)
  }, [entityId, setEntityTileSize, onPreviewChange])

  const isResizing = currentSpan !== current
  const entity = entities[entityId]
  const label = entityLabel(entityId, entity?.attributes?.friendly_name as string, entityLabels)

  return (
    <>
      <div className="absolute inset-0 z-10 rounded-2xl bg-black/60 backdrop-blur-[2px] pointer-events-none flex flex-col">

        {/* Top bar: drag handle (center) + size badge (right, only while resizing) */}
        <div className="flex items-center justify-between px-2 pt-1.5 shrink-0">
          <div className="w-5" />
          <div className="pointer-events-auto cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-white/40" />
          </div>
          <div className="w-5 flex justify-end">
            {isResizing && (
              <span className="text-[10px] font-mono font-bold text-ios-blue leading-none">
                {currentSpan}
              </span>
            )}
          </div>
        </div>

        {/* Entity name — centered in remaining space */}
        <div className="flex-1 flex items-center justify-center px-2 min-h-0">
          <p className="text-[11px] font-semibold text-white text-center leading-snug line-clamp-2">
            {label}
          </p>
        </div>

        {/* Bottom bar: action buttons (left) + resize handle (right) */}
        <div className="flex items-center justify-between px-1.5 pb-1.5 shrink-0 pointer-events-auto">
          <div className="flex gap-1">
            {/* Icon picker */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowIconPicker(true) }}
              className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/35 flex items-center justify-center"
              title={t('icon')}
            >
              <Activity className="w-3.5 h-3.5 text-white" />
            </button>
            {/* Favourite */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(entityId) }}
              className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/35 flex items-center justify-center"
              title={isFavorited ? t('rem_favorites') : t('add_favorites')}
            >
              <Heart className={cn('w-3.5 h-3.5', isFavorited ? 'fill-ios-red text-ios-red' : 'text-white')} />
            </button>
            {/* Hide */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleHideEntity(entityId) }}
              className="w-7 h-7 rounded-lg bg-red-500/70 hover:bg-red-500/90 flex items-center justify-center"
              title={t('hide_entity')}
            >
              <EyeOff className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Resize handle */}
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center cursor-nwse-resize transition-colors',
              isResizing ? 'bg-ios-blue/80' : 'bg-white/20 hover:bg-white/35',
            )}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            title={t('drag_resize')}
          >
            <GripHorizontal className="w-3.5 h-3.5 text-white rotate-45" />
          </div>
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
  contextId?: string
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
}

function TileWrapper({ entity, span, isEditMode, isDragging, isDragOver, contextId, onDragStart, onDragOver, onDrop, onDragEnd }: TileWrapperProps) {
  const tileRef = useRef<HTMLDivElement>(null)
  // previewSpan is lifted here so the grid cell itself resizes during drag
  const [previewSpan, setPreviewSpan] = useState<TileSpan | null>(null)
  const activeSpan = previewSpan ?? span
  // Jiggle only when in edit mode and not actively dragging or resizing
  const jiggle = isEditMode && !isDragging && !previewSpan

  return (
    <div
      ref={tileRef}
      draggable={isEditMode && !!contextId}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'relative',
        // Instant resize during drag preview, animated otherwise
        previewSpan ? 'transition-none' : 'transition-all duration-150',
        SPAN_CLASSES[activeSpan],
        isDragging && 'opacity-40 scale-95',
        isDragOver && 'ring-2 ring-ios-blue ring-offset-1 ring-offset-transparent rounded-2xl',
        // Blue ring while resizing to show preview
        previewSpan && previewSpan !== span && 'ring-2 ring-ios-blue/70 rounded-2xl',
        jiggle && 'tile-edit-mode',
      )}
    >
      <Tile entity={entity} />
      {isEditMode && (
        <EditOverlay
          entityId={entity.entity_id}
          tileRef={tileRef}
          currentSpan={activeSpan}
          onPreviewChange={setPreviewSpan}
        />
      )}
    </div>
  )
}

interface TilesGridProps {
  entities: HassEntity[]
  contextId?: string
  className?: string
  onAddEntity?: () => void
}

export function TilesGrid({ entities, contextId, className, onAddEntity }: TilesGridProps) {
  const { theme, isEditMode, entityTileSizes, hiddenEntities, entityOrder, setContextEntityOrder } = useHA()
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

  const showAddTile = isEditMode && !!onAddEntity

  if (ordered.length === 0 && !showAddTile) return null

  return (
    <div
      className={cn('grid gap-2 sm:gap-3 px-4', GRID_COLS[theme.tileSize], className)}
      style={{ gridAutoRows: `${TILE_ROW_H[theme.tileSize]}px` }}
    >
      {ordered.map((entity) => {
        const domain = getDomain(entity.entity_id)
        const defaultSpan = domain === 'person' ? '2x1' : domain === 'media_player' ? '2x2' : '1x1'
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
            contextId={contextId}
            onDragStart={() => setDragId(entity.entity_id)}
            onDragOver={(e) => { e.preventDefault(); if (dragId) setDragOverId(entity.entity_id) }}
            onDrop={() => handleDrop(entity.entity_id)}
            onDragEnd={() => { setDragId(null); setDragOverId(null) }}
          />
        )
      })}

      {/* Add-entity tile — only in edit mode */}
      {showAddTile && (
        <button
          onClick={onAddEntity}
          className={cn(
            'relative rounded-2xl flex flex-col items-center justify-center gap-1.5',
            'border-2 border-dashed border-white/20 text-white/40',
            'hover:border-white/40 hover:text-white/70 transition-colors',
            SPAN_CLASSES['1x1'],
          )}
        >
          <Plus className="w-6 h-6" />
          <span className="text-xs font-medium">{t('add_entity')}</span>
        </button>
      )}
    </div>
  )
}
