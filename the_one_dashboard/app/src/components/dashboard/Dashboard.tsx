import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Header } from './Header'
import { TilesGrid } from './TilesGrid'
import { Sidebar } from './Sidebar'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { UserPicker } from './UserPicker'
import { useHA } from '@/hooks/useHAClient'
import { getDomain, entityLabel, cn } from '@/lib/utils'
import { GRID_COLS, TILE_ROW_H } from '@/lib/theme-storage'
import { t, tn } from '@/lib/i18n'
import { SPAN_CLASSES, snapSpan, type TileSpan } from '@/lib/tile-sizes'
import {
  Wifi, Activity, GripVertical, GripHorizontal, Star,
  Home, Sofa, BedDouble, ChefHat, Bath, Car, Flower2, Tv, Dumbbell,
  Lightbulb, Thermometer, Check, Plus, RotateCcw, Search, X, Image,
} from 'lucide-react'
import { PersonTile } from '@/components/tiles/PersonTile'
import type { HassEntity } from '@/types/ha-types'
import type { LucideIcon } from 'lucide-react'

const TILE_DOMAINS = new Set([
  'light', 'switch', 'input_boolean', 'climate', 'lock', 'cover', 'sensor', 'binary_sensor', 'person',
])

function ConnectingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh text-ios-secondary">
      <Wifi className="w-12 h-12 mb-4 animate-pulse" />
      <p className="text-base font-medium text-ios-label">{t('connecting')}</p>
      <p className="text-sm mt-1">{t('connecting_wait')}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-ios-secondary px-8 text-center">
      <Activity className="w-12 h-12 mb-4 opacity-40" />
      <p className="text-base font-medium">{t('no_entities')}</p>
      <p className="text-sm mt-1 opacity-70">{t('no_entities_hint')}</p>
    </div>
  )
}

const ALL_TILE_DOMAINS = new Set([
  'light', 'switch', 'input_boolean', 'climate', 'lock', 'cover',
  'sensor', 'binary_sensor', 'person', 'scene', 'automation', 'script',
  'weather', 'media_player', 'camera', 'calendar',
])

// ── Add-entity modal (scoped to one area) ────────────────────────────────────

interface AddEntityModalProps {
  areaId: string
  areaName: string
  onClose: () => void
}

function AddEntityModal({ areaId, areaName, onClose }: AddEntityModalProps) {
  const { entities, resolveEntityArea, entityAreaOverrides, saveEntityAreaOverrides } = useHA()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const available = useMemo(() => {
    const q = search.toLowerCase()
    return Object.values(entities)
      .filter((e) => {
        if (!ALL_TILE_DOMAINS.has(getDomain(e.entity_id))) return false
        if (resolveEntityArea(e.entity_id) === areaId) return false
        if (!q) return true
        const lbl = entityLabel(e.entity_id, e.attributes.friendly_name).toLowerCase()
        return lbl.includes(q) || e.entity_id.toLowerCase().includes(q)
      })
      .sort((a, b) =>
        entityLabel(a.entity_id, a.attributes.friendly_name)
          .localeCompare(entityLabel(b.entity_id, b.attributes.friendly_name))
      )
  }, [entities, resolveEntityArea, areaId, search])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = () => {
    if (selected.size === 0) { onClose(); return }
    const next = { ...entityAreaOverrides }
    selected.forEach((id) => { next[id] = areaId })
    saveEntityAreaOverrides(next)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div
        className="bg-ios-card rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[75dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <p className="text-sm font-bold text-ios-label">{t('add_to_area', { area: areaName })}</p>
            {selected.size > 0 && (
              <p className="text-xs text-ios-secondary">{t('n_selected', { n: selected.size })}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 text-ios-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10">
            <Search className="w-4 h-4 text-ios-secondary shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder={t('search_entities')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-ios-label placeholder:text-ios-secondary outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-ios-secondary" /></button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-0.5">
          {available.length === 0 && (
            <p className="text-center text-xs text-ios-secondary py-6">{t('no_available')}</p>
          )}
          {available.map((e) => {
            const isSelected = selected.has(e.entity_id)
            return (
              <button
                key={e.entity_id}
                onClick={() => toggle(e.entity_id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                  isSelected ? 'bg-ios-blue/20' : 'hover:bg-white/10'
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                  isSelected ? 'border-ios-blue bg-ios-blue' : 'border-white/30'
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ios-label truncate">
                    {entityLabel(e.entity_id, e.attributes.friendly_name)}
                  </p>
                  <p className="text-xs text-ios-secondary truncate">{e.entity_id}</p>
                </div>
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-md shrink-0',
                  e.state === 'on' || e.state === 'home' ? 'bg-ios-green/20 text-ios-green' : 'bg-white/10 text-ios-secondary'
                )}>{e.state}</span>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2 border-t border-white/10">
          <button
            onClick={handleSave}
            disabled={selected.size === 0}
            className={cn(
              'w-full py-3 rounded-xl text-sm font-semibold transition-colors',
              selected.size > 0 ? 'bg-ios-blue text-white' : 'bg-white/10 text-ios-secondary cursor-not-allowed'
            )}
          >
            {selected.size > 0
              ? t('add_n_entities', { n: selected.size, word: tn(selected.size, 'entity_word_one', 'entity_word_many') })
              : t('select_entities')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit mode bottom toolbar ──────────────────────────────────────────────────

interface EditToolbarProps {
  onDone: () => void
  onAddEntity?: () => void
  lastHiddenLabel?: string
  onUndoHide?: () => void
}

function EditToolbar({ onDone, onAddEntity, lastHiddenLabel, onUndoHide }: EditToolbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-2 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-ios-card/80 backdrop-blur-xl border-t border-white/10">
      {/* Undo hide — only when available */}
      {onUndoHide && lastHiddenLabel && (
        <button
          onClick={onUndoHide}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ios-amber/20 text-ios-amber text-xs font-semibold flex-1 min-w-0"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t('undo_hide', { name: lastHiddenLabel })}</span>
        </button>
      )}

      {/* Add entity — only when in a room context */}
      {onAddEntity && (
        <button
          onClick={onAddEntity}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-ios-label text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('add')}
        </button>
      )}

      {/* Done */}
      <button
        onClick={onDone}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ios-green/90 text-white text-sm font-bold ml-auto"
      >
        <Check className="w-4 h-4" />
        {t('done')}
      </button>
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

/** Compress an image file to a JPEG data URL (max 640px wide, quality 0.75) */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const maxW = 640
      const scale = Math.min(1, maxW / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('no ctx')); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = reject
    img.src = url
  })
}

function AreaCard({
  areaId, areaName, entities, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd, onClick,
}: AreaCardProps) {
  const { theme, isEditMode, entityTileSizes, setEntityTileSize, areaImages, saveAreaImage, removeAreaImage } = useHA()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bgImage = areaImages[areaId]

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await compressImage(file)
      saveAreaImage(areaId, dataUrl)
    } catch {
      // ignore compression errors
    }
    // reset file input so same file can be re-selected
    e.target.value = ''
  }
  const isGlass = theme.tileStyle === 'glass'
  const opacity = theme.tileOpacity / 100
  const span = entityTileSizes[areaId] ?? '1x1'
  const cardRef = useRef<HTMLDivElement>(null)
  const [previewSpan, setPreviewSpan] = useState<TileSpan | null>(null)
  const activeSpan = previewSpan ?? span
  const resizeStart = useRef<{ x: number; y: number; span: TileSpan; w: number; h: number } | null>(null)

  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    resizeStart.current = { x: e.clientX, y: e.clientY, span, w: rect.width, h: rect.height }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [span])

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizeStart.current) return
    const { x, y, span: s, w, h } = resizeStart.current
    setPreviewSpan(snapSpan(s, e.clientX - x, e.clientY - y, w, h))
  }, [])

  const onResizePointerUp = useCallback((e: React.PointerEvent) => {
    if (!resizeStart.current) return
    const { x, y, span: s, w, h } = resizeStart.current
    setEntityTileSize(areaId, snapSpan(s, e.clientX - x, e.clientY - y, w, h))
    resizeStart.current = null
    setPreviewSpan(null)
  }, [areaId, setEntityTileSize])

  const lightsOn = entities.filter(
    (e) => getDomain(e.entity_id) === 'light' && e.state === 'on'
  ).length
  const switchesOn = entities.filter(
    (e) => ['switch', 'input_boolean'].includes(getDomain(e.entity_id)) && e.state === 'on'
  ).length
  const activeCount = lightsOn + switchesOn

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
  const isResizing = previewSpan !== null && previewSpan !== span

  // When a background image is set, always use white text with a dark gradient overlay
  const bgStyle: React.CSSProperties = bgImage
    ? {}
    : isGlass
      ? hasActivity
        ? { background: `rgba(255,159,10,${0.18 * opacity})`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid rgba(255,255,255,${0.18 * opacity})` }
        : { background: `rgba(255,255,255,${0.06 * opacity})`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid rgba(255,255,255,${0.10 * opacity})` }
      : hasActivity
        ? { background: `rgba(255,159,10,${0.18 * opacity})` }
        : { background: `rgba(44,44,46,${opacity})` }

  return (
    <div
      ref={cardRef}
      draggable={isEditMode && !resizeStart.current}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={() => { if (!isEditMode) onClick() }}
      className={cn(
        'relative rounded-2xl overflow-hidden p-3 sm:p-4 flex flex-col justify-between',
        previewSpan ? 'transition-none' : 'transition-all duration-150',
        'cursor-pointer select-none',
        !isEditMode && 'active:scale-95',
        isDragOver && 'ring-2 ring-ios-blue ring-offset-1 ring-offset-transparent opacity-60',
        isResizing && 'ring-2 ring-ios-blue/70',
        isEditMode && !previewSpan && 'tile-edit-mode',
        SPAN_CLASSES[activeSpan],
      )}
      style={bgStyle}
    >
      {/* Background image with gradient overlay */}
      {bgImage && (
        <>
          <img
            src={bgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)' }}
          />
        </>
      )}

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Top row: icon + drag-reorder handle */}
      <div className="relative flex items-start justify-between">
        <AreaIcon className={cn('w-6 h-6', bgImage ? 'text-white/80' : hasActivity ? 'text-ios-amber' : 'text-ios-secondary')} />
        {isEditMode && (
          <GripVertical className="w-4 h-4 text-white/50 cursor-grab active:cursor-grabbing" />
        )}
      </div>

      {/* Middle: activity badges */}
      <div className="relative flex flex-wrap gap-1 my-1">
        {lightsOn > 0 && (
          <span className={cn('flex items-center gap-0.5 text-[10px] font-medium', bgImage ? 'text-white/90' : 'text-ios-amber')}>
            <Lightbulb className="w-3 h-3" />{lightsOn}
          </span>
        )}
        {tempLabel && (
          <span className={cn('flex items-center gap-0.5 text-[10px] font-medium', bgImage ? 'text-white/70' : 'text-ios-secondary')}>
            <Thermometer className="w-3 h-3" />{tempLabel}{tempUnit}
          </span>
        )}
      </div>

      {/* Bottom: name + count */}
      <div className="relative">
        <p className={cn('text-sm font-semibold leading-tight truncate', bgImage ? 'text-white' : hasActivity ? 'text-ios-label' : 'text-ios-secondary')}>
          {areaName}
        </p>
        <p className={cn('text-xs mt-0.5', bgImage ? 'text-white/70' : 'text-ios-secondary')}>
          {tn(entities.length, 'devices_one', 'devices_many')}
          {activeCount > 0 && ` ${t('active_count', { n: activeCount })}`}
        </p>
      </div>

      {/* Edit mode: size label + image upload + resize handle */}
      {isEditMode && (
        <>
          <span className={cn(
            'absolute top-2 right-2 text-[10px] font-mono transition-colors z-10',
            isResizing ? 'text-ios-blue font-bold' : 'text-white/40'
          )}>
            {activeSpan}
          </span>

          {/* Image upload / remove button */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
            >
              <Image className="w-3 h-3" />
              {bgImage ? 'Change' : 'Photo'}
            </button>
            {bgImage && (
              <button
                onClick={(e) => { e.stopPropagation(); removeAreaImage(areaId) }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-red-500/60 text-white hover:bg-red-500/80 backdrop-blur-sm"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div
            className={cn(
              'absolute bottom-1.5 right-1.5 w-6 h-6 rounded-lg flex items-center justify-center cursor-nwse-resize transition-colors z-10',
              isResizing ? 'bg-ios-blue/80' : 'bg-white/20 hover:bg-white/40',
            )}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            title={t('drag_resize')}
          >
            <GripHorizontal className="w-3.5 h-3.5 text-white rotate-45" />
          </div>
        </>
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
            {t('open_settings')}
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
            <h2 className="text-base font-bold text-ios-label">{t('favorites')}</h2>
            <span className="text-xs text-ios-secondary ml-1">{favoriteEntities.length}</span>
          </div>
          <TilesGrid entities={favoriteEntities} contextId="favorites" />
        </div>
      )}

      {/* People — side-by-side equal-height cards */}
      {personEntities.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-4 pt-5 pb-2">
            <Home className="w-4 h-4 text-ios-blue" />
            <h2 className="text-base font-bold text-ios-label">{t('people')}</h2>
            <span className="text-xs text-ios-secondary ml-1">{personEntities.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 px-4 items-start">
            {personEntities.map((e) => (
              <PersonTile key={e.entity_id} entityId={e.entity_id} />
            ))}
          </div>
        </div>
      )}

      {/* Area cards grid */}
      {areasWithEntities.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-4 pt-5 pb-2">
            <Home className="w-4 h-4 text-ios-secondary" />
            <h2 className="text-base font-bold text-ios-label">{t('rooms')}</h2>
          </div>
          <div
            className={cn('grid gap-2 sm:gap-3 px-4', GRID_COLS[theme.tileSize])}
            style={{ gridAutoRows: `${TILE_ROW_H[theme.tileSize] * 2}px` }}
          >
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
  const {
    status, entities, resolveEntityArea, currentUserId, haUsers, selectUser,
    isEditMode, toggleEditMode, hiddenEntities, toggleHideEntity,
    haAreas, customAreas, callService,
  } = useHA()

  // Read URL query params once on mount
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), [])
  const initialView = searchParams.get('view') ?? 'home'
  // hideMenu (?menu=false) previously hid RoomTabs — tabs are now removed

  const [activeTab, setActiveTab] = useState(initialView)
  const [showSettings, setShowSettings] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Auto-apply Browser Mod topbar hide once HA is connected
  const headerAppliedRef = useRef(false)
  useEffect(() => {
    if (status !== 'connected' || headerAppliedRef.current) return
    if (localStorage.getItem('hk_hide_ha_header') !== 'true') return
    headerAppliedRef.current = true
    const code =
      `(function(){try{` +
      `var main=document.querySelector('home-assistant')?.shadowRoot?.querySelector('home-assistant-main');` +
      `if(!main||!main.shadowRoot)return;` +
      `if(main.shadowRoot.getElementById('__tod_hh__'))return;` +
      `var s=document.createElement('style');s.id='__tod_hh__';` +
      `s.textContent='app-header,app-toolbar,.header,[class*="toolbar"]{display:none!important}';` +
      `main.shadowRoot.appendChild(s);` +
      `}catch(e){}})();`
    callService('browser_mod', 'javascript', { code })
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Undo-hide: track the last entity that was newly hidden while in edit mode
  const prevHiddenRef = useRef<string[]>(hiddenEntities)
  const [lastHiddenId, setLastHiddenId] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditMode) {
      setLastHiddenId(null)
      prevHiddenRef.current = hiddenEntities
      return
    }
    const prev = prevHiddenRef.current
    const newlyHidden = hiddenEntities.find((id) => !prev.includes(id))
    if (newlyHidden) setLastHiddenId(newlyHidden)
    prevHiddenRef.current = hiddenEntities
  }, [hiddenEntities, isEditMode])

  const handleUndoHide = () => {
    if (!lastHiddenId) return
    toggleHideEntity(lastHiddenId)
    setLastHiddenId(null)
  }

  // Resolve area name for the active tab
  const activeAreaName = useMemo(() => {
    if (activeTab === 'home') return ''
    const ha = haAreas.find((a) => a.area_id === activeTab)
    if (ha) return ha.name
    const custom = customAreas.find((a) => a.area_id === activeTab)
    return custom?.name ?? activeTab
  }, [activeTab, haAreas, customAreas])

  // Last hidden entity label (for undo button)
  const lastHiddenLabel = useMemo(() => {
    if (!lastHiddenId) return undefined
    const e = entities[lastHiddenId]
    return entityLabel(lastHiddenId, e?.attributes.friendly_name)
  }, [lastHiddenId, entities])

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

  // Whether we're viewing a specific room (not home) — enables Add Entity
  const isRoomView = activeTab !== 'home'

  return (
    <div className="flex min-h-dvh max-w-screen-2xl mx-auto">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={(tab) => { setActiveTab(tab); setSidebarOpen(false) }}
      />
      <div className={cn('flex-1 min-w-0', isEditMode && 'pb-20')}>
        {/* Fallback picker: shown only when ingress auto-detection failed and there are multiple users */}
        {status === 'connected' && currentUserId === null && haUsers.length > 1 && (
          <UserPicker users={haUsers} onSelect={selectUser} />
        )}
        <Header
          onSettingsClick={() => setShowSettings(true)}
          onSidebarToggle={() => setSidebarOpen((v) => !v)}
          onHomeClick={() => setActiveTab('home')}
          currentRoom={activeTab !== 'home' ? activeAreaName : undefined}
        />
        {activeTab === 'home'
          ? <HomeView onShowSettings={() => setShowSettings(true)} onTabChange={setActiveTab} />
          : <TilesGrid
              entities={filteredEntities}
              contextId={activeTab}
              className="pt-3"
              onAddEntity={isEditMode && isRoomView ? () => setShowAddModal(true) : undefined}
            />
        }
      </div>

      {/* Edit mode floating toolbar */}
      {isEditMode && (
        <EditToolbar
          onDone={toggleEditMode}
          onAddEntity={isRoomView ? () => setShowAddModal(true) : undefined}
          lastHiddenLabel={lastHiddenLabel}
          onUndoHide={lastHiddenId ? handleUndoHide : undefined}
        />
      )}

      {/* Add entity modal */}
      {showAddModal && isRoomView && (
        <AddEntityModal
          areaId={activeTab}
          areaName={activeAreaName}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
