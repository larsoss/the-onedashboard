import { useState, useRef, useCallback, useEffect } from 'react'
import { GripVertical, GripHorizontal, Trash2, Plus, Pencil, Check } from 'lucide-react'
import { LightTile } from '@/components/tiles/LightTile'
import { LightGroupTile } from '@/components/tiles/LightGroupTile'
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
import { ClockTile } from '@/components/tiles/ClockTile'
import { useHA } from '@/hooks/useHAClient'
import { GRID_COLS, TILE_ROW_H } from '@/lib/theme-storage'
import { SPAN_CLASSES, spanToUnits, unitsToSpan, type TileSpan } from '@/lib/tile-sizes'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import type { WidgetInstance } from '@/lib/widget-storage'

// ── WidgetRenderer ────────────────────────────────────────────────────────────

function WidgetRenderer({ widget }: { widget: WidgetInstance }) {
  const primaryId = widget.entityIds[0] ?? ''

  switch (widget.type) {
    case 'light':
      return widget.entityIds.length > 1
        ? <LightGroupTile entityIds={widget.entityIds} title={widget.title} />
        : <LightTile entityId={primaryId} />
    case 'switch':       return <SwitchTile entityId={primaryId} />
    case 'climate':      return <ThermostatTile entityId={primaryId} />
    case 'lock':         return <LockTile entityId={primaryId} />
    case 'cover':        return <CoverTile entityId={primaryId} />
    case 'sensor':
    case 'binary_sensor': return <SensorTile entityId={primaryId} />
    case 'person':       return <PersonTile entityId={primaryId} />
    case 'scene':        return <SceneTile entityId={primaryId} />
    case 'automation':   return <AutomationTile entityId={primaryId} />
    case 'script':       return <ScriptTile entityId={primaryId} />
    case 'weather':      return <WeatherTile entityId={primaryId} />
    case 'media_player': return <MediaPlayerTile entityId={primaryId} />
    case 'camera':       return <CameraTile entityId={primaryId} />
    case 'calendar':     return <CalendarTile entityId={primaryId} />
    case 'clock':        return <ClockTile title={widget.title} />
    default:             return null
  }
}

// ── Snap span logic (same as TilesGrid) ──────────────────────────────────────

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

// ── Widget edit overlay ───────────────────────────────────────────────────────

interface WidgetEditOverlayProps {
  widget: WidgetInstance
  tileRef: React.RefObject<HTMLDivElement>
  currentSpan: TileSpan
  onDelete: () => void
  onPreviewChange: (span: TileSpan | null) => void
  onSpanCommit: (span: TileSpan) => void
  onTitleChange: (title: string | undefined) => void
}

function WidgetEditOverlay({
  widget, tileRef, currentSpan, onDelete, onPreviewChange, onSpanCommit, onTitleChange,
}: WidgetEditOverlayProps) {
  const dragStart = useRef<{ x: number; y: number; span: TileSpan; cellW: number; cellH: number } | null>(null)
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelInput, setLabelInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const el = tileRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    dragStart.current = { x: e.clientX, y: e.clientY, span: currentSpan, cellW: rect.width, cellH: rect.height }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [currentSpan, tileRef])

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return
    const { x, y, span, cellW, cellH } = dragStart.current
    onPreviewChange(snapSpan(span, e.clientX - x, e.clientY - y, cellW, cellH))
  }, [onPreviewChange])

  const onResizePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return
    const { x, y, span, cellW, cellH } = dragStart.current
    const newSpan = snapSpan(span, e.clientX - x, e.clientY - y, cellW, cellH)
    onSpanCommit(newSpan)
    dragStart.current = null
    onPreviewChange(null)
  }, [onPreviewChange, onSpanCommit])

  useEffect(() => {
    if (editingLabel) inputRef.current?.focus()
  }, [editingLabel])

  const commitLabel = () => {
    onTitleChange(labelInput.trim() || undefined)
    setEditingLabel(false)
  }

  const isResizing = currentSpan !== widget.span

  const displayName = widget.title
    ?? (widget.entityIds[0] ? widget.entityIds[0].split('.')[1]?.replace(/_/g, ' ') ?? widget.type : widget.type)

  return (
    <div className="absolute inset-0 z-10 rounded-2xl bg-black/60 backdrop-blur-[2px] pointer-events-none flex flex-col">
      {/* Top bar: drag handle */}
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

      {/* Center: editable label */}
      <div className="flex-1 flex items-center justify-center px-2 min-h-0 pointer-events-auto">
        {editingLabel ? (
          <div className="flex items-center gap-1 w-full">
            <input
              ref={inputRef}
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitLabel()
                if (e.key === 'Escape') setEditingLabel(false)
              }}
              placeholder={displayName}
              className="flex-1 min-w-0 text-[11px] text-white bg-white/20 rounded-lg px-2 py-1 outline-none border border-ios-blue/60 placeholder:text-white/40"
            />
            <button onClick={commitLabel} className="shrink-0 text-ios-blue">
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setLabelInput(widget.title ?? ''); setEditingLabel(true) }}
            className="flex items-center gap-1 max-w-full"
          >
            <p className="text-[11px] font-semibold text-white text-center leading-snug line-clamp-2 capitalize">
              {displayName}
            </p>
            <Pencil className="w-2.5 h-2.5 text-white/50 shrink-0" />
          </button>
        )}
      </div>

      {/* Bottom bar: delete + resize */}
      <div className="flex items-center justify-between px-1.5 pb-1.5 shrink-0 pointer-events-auto">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="w-7 h-7 rounded-lg bg-red-500/70 hover:bg-red-500/90 flex items-center justify-center"
          title="Remove widget"
        >
          <Trash2 className="w-3.5 h-3.5 text-white" />
        </button>

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
  )
}

// ── WidgetTileWrapper ─────────────────────────────────────────────────────────

interface WidgetTileWrapperProps {
  widget: WidgetInstance
  contextId: string
  isEditMode: boolean
  isDragging: boolean
  isDragOver: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
  onDelete: () => void
  onSpanChange: (span: TileSpan) => void
  onTitleChange: (title: string | undefined) => void
}

function WidgetTileWrapper({
  widget, contextId, isEditMode, isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd, onDelete, onSpanChange, onTitleChange,
}: WidgetTileWrapperProps) {
  const tileRef = useRef<HTMLDivElement>(null!)
  const [previewSpan, setPreviewSpan] = useState<TileSpan | null>(null)
  const activeSpan = previewSpan ?? widget.span
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
        previewSpan ? 'transition-none' : 'transition-all duration-150',
        SPAN_CLASSES[activeSpan],
        isDragging && 'opacity-40 scale-95',
        isDragOver && 'ring-2 ring-ios-blue ring-offset-1 ring-offset-transparent rounded-2xl',
        previewSpan && previewSpan !== widget.span && 'ring-2 ring-ios-blue/70 rounded-2xl',
        jiggle && 'tile-edit-mode',
      )}
    >
      <WidgetRenderer widget={widget} />
      {isEditMode && (
        <WidgetEditOverlay
          widget={widget}
          tileRef={tileRef}
          currentSpan={activeSpan}
          onDelete={onDelete}
          onPreviewChange={setPreviewSpan}
          onSpanCommit={onSpanChange}
          onTitleChange={onTitleChange}
        />
      )}
    </div>
  )
}

// ── WidgetGrid ────────────────────────────────────────────────────────────────

interface WidgetGridProps {
  widgets: WidgetInstance[]
  contextId: string
  className?: string
  onAddWidget?: () => void
  onWidgetsChange: (widgets: WidgetInstance[]) => void
}

export function WidgetGrid({ widgets, contextId, className, onAddWidget, onWidgetsChange }: WidgetGridProps) {
  const { theme, isEditMode } = useHA()
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    const from = widgets.findIndex((w) => w.id === dragId)
    const to = widgets.findIndex((w) => w.id === targetId)
    if (from === -1 || to === -1) return
    const next = [...widgets]
    next.splice(from, 1)
    next.splice(to, 0, widgets[from])
    onWidgetsChange(next)
    setDragId(null)
    setDragOverId(null)
  }

  const handleDelete = (widgetId: string) => {
    onWidgetsChange(widgets.filter((w) => w.id !== widgetId))
  }

  const handleSpanChange = (widgetId: string, span: TileSpan) => {
    onWidgetsChange(widgets.map((w) => w.id === widgetId ? { ...w, span } : w))
  }

  const handleTitleChange = (widgetId: string, title: string | undefined) => {
    onWidgetsChange(widgets.map((w) => w.id === widgetId ? { ...w, title } : w))
  }

  const showAddTile = isEditMode && !!onAddWidget

  if (widgets.length === 0 && !showAddTile) return null

  return (
    <div
      className={cn('grid gap-2 sm:gap-3 px-4', GRID_COLS[theme.tileSize], className)}
      style={{ gridAutoRows: `${TILE_ROW_H[theme.tileSize]}px` }}
    >
      {widgets.map((widget) => (
        <WidgetTileWrapper
          key={widget.id}
          widget={widget}
          contextId={contextId}
          isEditMode={isEditMode}
          isDragging={dragId === widget.id}
          isDragOver={dragOverId === widget.id && dragId !== widget.id}
          onDragStart={() => setDragId(widget.id)}
          onDragOver={(e) => { e.preventDefault(); if (dragId) setDragOverId(widget.id) }}
          onDrop={() => handleDrop(widget.id)}
          onDragEnd={() => { setDragId(null); setDragOverId(null) }}
          onDelete={() => handleDelete(widget.id)}
          onSpanChange={(span) => handleSpanChange(widget.id, span)}
          onTitleChange={(title) => handleTitleChange(widget.id, title)}
        />
      ))}

      {showAddTile && (
        <button
          onClick={onAddWidget}
          className={cn(
            'relative rounded-2xl flex flex-col items-center justify-center gap-1.5',
            'border-2 border-dashed border-white/20 text-white/40',
            'hover:border-white/40 hover:text-white/70 transition-colors',
            SPAN_CLASSES['1x1'],
          )}
        >
          <Plus className="w-6 h-6" />
          <span className="text-xs font-medium">Widget</span>
        </button>
      )}
    </div>
  )
}
