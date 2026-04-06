import { useState } from 'react'
import type { HassEntity } from '@/types/ha-types'
import { getDomain } from '@/lib/utils'
import { LightTile } from '@/components/tiles/LightTile'
import { SwitchTile } from '@/components/tiles/SwitchTile'
import { ThermostatTile } from '@/components/tiles/ThermostatTile'
import { LockTile } from '@/components/tiles/LockTile'
import { CoverTile } from '@/components/tiles/CoverTile'
import { SensorTile } from '@/components/tiles/SensorTile'
import { PersonTile } from '@/components/tiles/PersonTile'
import { BaseTile } from '@/components/tiles/BaseTile'
import { useHA } from '@/hooks/useHAClient'
import { GRID_COLS } from '@/lib/theme-storage'
import { SPAN_CLASSES, type TileSpan } from '@/lib/tile-sizes'
import { ICON_OPTIONS } from '@/lib/icons'
import { Activity, EyeOff, X, Heart, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUPPORTED_DOMAINS = new Set([
  'light', 'switch', 'input_boolean', 'climate', 'lock', 'cover', 'sensor', 'binary_sensor', 'person',
])

const SPAN_OPTIONS: { span: TileSpan; label: string }[] = [
  { span: '1x1', label: '1×1' },
  { span: '2x1', label: '2×1' },
  { span: '1x2', label: '1×2' },
  { span: '2x2', label: '2×2' },
]

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

interface EditOverlayProps {
  entityId: string
}

function EditOverlay({ entityId }: EditOverlayProps) {
  const { entityTileSizes, setEntityTileSize, toggleHideEntity, toggleFavorite, favorites } = useHA()
  const [showIconPicker, setShowIconPicker] = useState(false)
  const current = entityTileSizes[entityId] ?? '1x1'
  const isFavorited = favorites.includes(entityId)

  return (
    <>
      <div className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-[2px] pointer-events-none">
        {/* Drag handle */}
        <div className="pointer-events-auto absolute top-2 left-1/2 -translate-x-1/2 cursor-grab">
          <GripVertical className="w-4 h-4 text-white/60" />
        </div>
        {/* Span buttons */}
        <div className="flex flex-wrap gap-1 justify-center px-2 pointer-events-auto">
          {SPAN_OPTIONS.map(({ span, label }) => (
            <button
              key={span}
              onClick={(e) => { e.stopPropagation(); setEntityTileSize(entityId, span) }}
              className={cn(
                'px-2 py-1 rounded-lg text-xs font-medium transition-all',
                current === span
                  ? 'bg-ios-blue text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              )}
            >
              {label}
            </button>
          ))}
        </div>
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
      </div>
      {showIconPicker && (
        <IconPicker entityId={entityId} onClose={() => setShowIconPicker(false)} />
      )}
    </>
  )
}

interface TilesGridProps {
  entities: HassEntity[]
  contextId?: string   // area_id or 'favorites' — used for drag-reorder persistence
  className?: string
}

export function TilesGrid({ entities, contextId, className }: TilesGridProps) {
  const { theme, isEditMode, entityTileSizes, hiddenEntities, entityOrder, setContextEntityOrder, favorites } = useHA()
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // Filter hidden + unsupported
  const base = entities.filter(
    (e) => SUPPORTED_DOMAINS.has(getDomain(e.entity_id)) && !hiddenEntities.includes(e.entity_id)
  )

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
          <div
            key={entity.entity_id}
            draggable={isEditMode && !!contextId}
            onDragStart={() => setDragId(entity.entity_id)}
            onDragOver={(e) => { e.preventDefault(); if (dragId) setDragOverId(entity.entity_id) }}
            onDrop={() => handleDrop(entity.entity_id)}
            onDragEnd={() => { setDragId(null); setDragOverId(null) }}
            className={cn(
              'relative transition-all duration-150',
              SPAN_CLASSES[span],
              isDragging && 'opacity-40 scale-95',
              isDragOver && 'ring-2 ring-ios-blue ring-offset-1 ring-offset-transparent rounded-2xl',
            )}
          >
            <Tile entity={entity} />
            {isEditMode && <EditOverlay entityId={entity.entity_id} />}
            {!isEditMode && favorites.includes(entity.entity_id) && (
              <Heart className="w-3 h-3 fill-red-400 text-red-400 absolute top-1.5 right-1.5 z-5 pointer-events-none" />
            )}
          </div>
        )
      })}
    </div>
  )
}
