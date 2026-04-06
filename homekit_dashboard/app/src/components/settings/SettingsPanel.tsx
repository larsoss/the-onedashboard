import { useState, useMemo } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, Search, X, Check, Star } from 'lucide-react'
import {
  Lightbulb, ToggleRight, Thermometer, Lock, Blinds, Activity,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel, getDomain } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { ICON_OPTIONS, getIconByName } from '@/lib/icons'
import {
  ACCENT_CLASSES,
  ACCENT_HEX,
  BG_PREVIEW,
  type AccentColor,
  type TileStyle,
  type BgStyle,
  type TileSize,
  type TileShape,
  type IconSize,
} from '@/lib/theme-storage'
import type { CustomArea, EntityAreaOverrides } from '@/lib/area-storage'

const TILE_DOMAINS = new Set([
  'light', 'switch', 'input_boolean', 'climate', 'lock', 'cover', 'sensor', 'binary_sensor',
])

const DOMAIN_COLORS: Record<string, string> = {
  light:          'text-ios-amber',
  switch:         'text-ios-blue',
  input_boolean:  'text-ios-blue',
  climate:        'text-ios-amber',
  lock:           'text-ios-red',
  cover:          'text-ios-teal',
  sensor:         'text-ios-secondary',
  binary_sensor:  'text-ios-secondary',
}

function getDomainDefaultIcon(domain: string): LucideIcon {
  switch (domain) {
    case 'light': return Lightbulb
    case 'switch': case 'input_boolean': return ToggleRight
    case 'climate': return Thermometer
    case 'lock': return Lock
    case 'cover': return Blinds
    default: return Activity
  }
}

interface Props {
  onClose: () => void
}

// ── Entity Picker Dialog ────────────────────────────────────────────────────

interface EntityPickerProps {
  areaId: string
  areaName: string
  assignedIds: Set<string>
  onSave: (selected: string[]) => void
  onClose: () => void
}

function EntityPicker({ areaName, assignedIds, onSave, onClose }: EntityPickerProps) {
  const { entities } = useHA()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedIds))

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return Object.values(entities)
      .filter((e) => TILE_DOMAINS.has(getDomain(e.entity_id)))
      .filter((e) => {
        const label = entityLabel(e.entity_id, e.attributes.friendly_name).toLowerCase()
        return label.includes(q) || e.entity_id.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const la = entityLabel(a.entity_id, a.attributes.friendly_name)
        const lb = entityLabel(b.entity_id, b.attributes.friendly_name)
        return la.localeCompare(lb)
      })
  }, [entities, search])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[80dvh] flex flex-col p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-ios-separator">
          <DialogTitle>Edit: {areaName}</DialogTitle>
          <p className="text-xs text-ios-secondary mt-0.5">{selected.size} entities selected</p>
        </div>

        <div className="px-4 py-2 border-b border-ios-separator">
          <div className="flex items-center gap-2 bg-ios-card-2 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-ios-secondary shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search entities…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-ios-label text-sm outline-none placeholder:text-ios-secondary"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className="w-4 h-4 text-ios-secondary" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-ios-secondary text-sm py-10">No entities found</p>
          ) : (
            filtered.map((entity) => {
              const isChecked = selected.has(entity.entity_id)
              const domain = getDomain(entity.entity_id)
              const label = entityLabel(entity.entity_id, entity.attributes.friendly_name)
              return (
                <button
                  key={entity.entity_id}
                  onClick={() => toggle(entity.entity_id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ios-card-2 transition-colors text-left border-b border-ios-separator/50"
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                      isChecked
                        ? 'bg-ios-blue border-ios-blue'
                        : 'border-ios-secondary'
                    )}
                  >
                    {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ios-label truncate">{label}</p>
                    <p className={cn('text-xs truncate', DOMAIN_COLORS[domain] ?? 'text-ios-secondary')}>
                      {entity.entity_id}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="p-4 border-t border-ios-separator">
          <button
            onClick={() => onSave([...selected])}
            className="w-full py-3 rounded-2xl bg-ios-blue text-white text-sm font-semibold hover:bg-ios-blue/90 active:scale-95 transition-all"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── New Area Dialog ─────────────────────────────────────────────────────────

function NewAreaDialog({
  onSave,
  onClose,
}: {
  onSave: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogTitle>New Area</DialogTitle>
        <input
          autoFocus
          type="text"
          placeholder="Area name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onSave(name.trim()) }}
          className="mt-4 w-full bg-ios-card-2 rounded-xl px-4 py-3 text-ios-label text-sm outline-none placeholder:text-ios-secondary"
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-ios-card-2 text-ios-secondary text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (name.trim()) onSave(name.trim()) }}
            disabled={!name.trim()}
            className="flex-1 py-3 rounded-2xl bg-ios-blue text-white text-sm font-semibold disabled:opacity-40 active:scale-95 transition-all"
          >
            Add
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Icon Picker Dialog ──────────────────────────────────────────────────────

function IconPickerDialog({
  entityId,
  onClose,
}: {
  entityId: string
  onClose: () => void
}) {
  const { entityIcons, saveEntityIcon } = useHA()
  const [selected, setSelected] = useState<string | null>(entityIcons[entityId] ?? null)

  const handleSave = () => {
    saveEntityIcon(entityId, selected)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[80dvh] flex flex-col p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-ios-separator">
          <DialogTitle>Choose Icon</DialogTitle>
          <p className="text-xs text-ios-secondary mt-0.5">
            {selected ? `Selected: ${selected}` : 'Tap an icon to select'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-2">
            {ICON_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isSelected = selected === opt.name
              return (
                <button
                  key={opt.name}
                  onClick={() => setSelected(isSelected ? null : opt.name)}
                  className={cn(
                    'aspect-square rounded-xl flex flex-col items-center justify-center gap-1 p-2 transition-all',
                    isSelected
                      ? 'bg-ios-blue/20 text-ios-blue ring-1 ring-ios-blue/50'
                      : 'bg-ios-card-2 text-ios-secondary hover:text-ios-label'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] leading-none truncate w-full text-center">
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-4 border-t border-ios-separator flex gap-3">
          <button
            onClick={() => { saveEntityIcon(entityId, null); onClose() }}
            className="px-4 py-3 rounded-2xl bg-ios-card-2 text-ios-secondary text-sm font-medium"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-ios-blue text-white text-sm font-semibold active:scale-95 transition-all"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Appearance Section ──────────────────────────────────────────────────────

const ACCENT_OPTIONS: Array<{ id: AccentColor; label: string }> = [
  { id: 'blue',   label: 'Blue'   },
  { id: 'teal',   label: 'Teal'   },
  { id: 'purple', label: 'Purple' },
  { id: 'green',  label: 'Green'  },
  { id: 'amber',  label: 'Amber'  },
]

const TILE_STYLE_OPTIONS: Array<{ id: TileStyle; label: string; desc: string }> = [
  { id: 'glass', label: 'Glass', desc: 'Frosted glass' },
  { id: 'solid', label: 'Solid', desc: 'Classic solid' },
]

const BG_OPTIONS: Array<{ id: BgStyle; label: string }> = [
  { id: 'dark',  label: 'Dark'  },
  { id: 'black', label: 'Black' },
  { id: 'navy',  label: 'Navy'  },
  { id: 'slate', label: 'Slate' },
]

const TILE_SIZE_OPTIONS: Array<{ id: TileSize; label: string; desc: string }> = [
  { id: 'compact', label: 'Compact', desc: 'More tiles' },
  { id: 'normal',  label: 'Normal',  desc: 'Default' },
  { id: 'large',   label: 'Large',   desc: 'Fewer tiles' },
]

const TILE_SHAPE_OPTIONS: Array<{ id: TileShape; label: string }> = [
  { id: 'square', label: 'Square' },
  { id: 'rect',   label: 'Rectangle' },
]

const ICON_SIZE_OPTIONS: Array<{ id: IconSize; label: string }> = [
  { id: 'small',  label: 'S' },
  { id: 'medium', label: 'M' },
  { id: 'large',  label: 'L' },
]

function OptionRow<T extends string>({
  label,
  options,
  value,
  onChange,
  accentCls,
}: {
  label: string
  options: Array<{ id: T; label: string; desc?: string }>
  value: T
  onChange: (v: T) => void
  accentCls: { bgLight: string; text: string }
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-ios-label mb-2">{label}</p>
      <div className="flex gap-2">
        {options.map((opt) => {
          const isSelected = value === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={cn(
                'flex-1 py-2.5 rounded-xl flex flex-col items-center gap-0.5 text-sm font-medium transition-all border',
                isSelected
                  ? cn('border-white/20 text-ios-label', accentCls.bgLight)
                  : 'border-transparent text-ios-secondary bg-ios-card-2/50 hover:bg-ios-card-2'
              )}
            >
              <span>{opt.label}</span>
              {opt.desc && <span className="text-[10px] text-ios-secondary font-normal">{opt.desc}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AppearanceSection() {
  const { theme, setTheme } = useHA()
  const accentCls = ACCENT_CLASSES[theme.accent]

  return (
    <div className="px-4 pb-8 space-y-4">
      {/* Accent color */}
      <div className="bg-ios-card rounded-2xl p-4">
        <p className="text-sm font-semibold text-ios-label mb-4">Accent Color</p>
        <div className="flex gap-3 flex-wrap">
          {ACCENT_OPTIONS.map((opt) => {
            const isSelected = theme.accent === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setTheme({ ...theme, accent: opt.id })}
                title={opt.label}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center transition-all',
                  isSelected ? 'ring-2 ring-offset-2 ring-offset-ios-card ring-white/60 scale-110' : 'opacity-80 hover:opacity-100'
                )}
                style={{ background: ACCENT_HEX[opt.id] }}
              >
                {isSelected && <Check className="w-5 h-5 text-white" strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tile style, shape, size, icon */}
      <div className="bg-ios-card rounded-2xl p-4 space-y-4">
        <OptionRow
          label="Tile Style"
          options={TILE_STYLE_OPTIONS}
          value={theme.tileStyle}
          onChange={(v) => setTheme({ ...theme, tileStyle: v })}
          accentCls={accentCls}
        />
        <OptionRow
          label="Tile Shape"
          options={TILE_SHAPE_OPTIONS}
          value={theme.tileShape}
          onChange={(v) => setTheme({ ...theme, tileShape: v })}
          accentCls={accentCls}
        />
        <OptionRow
          label="Tile Size"
          options={TILE_SIZE_OPTIONS}
          value={theme.tileSize}
          onChange={(v) => setTheme({ ...theme, tileSize: v })}
          accentCls={accentCls}
        />
        <OptionRow
          label="Icon Size"
          options={ICON_SIZE_OPTIONS}
          value={theme.iconSize}
          onChange={(v) => setTheme({ ...theme, iconSize: v })}
          accentCls={accentCls}
        />
      </div>

      {/* Opacity */}
      <div className="bg-ios-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-ios-label">Tile Opacity</p>
          <span className={cn('text-sm font-medium', accentCls.text)}>{theme.tileOpacity}%</span>
        </div>
        <Slider
          min={10}
          max={100}
          step={5}
          value={[theme.tileOpacity]}
          onValueChange={([v]) => setTheme({ ...theme, tileOpacity: v })}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[11px] text-ios-secondary">Transparent</span>
          <span className="text-[11px] text-ios-secondary">Opaque</span>
        </div>
      </div>

      {/* Background */}
      <div className="bg-ios-card rounded-2xl p-4">
        <p className="text-sm font-semibold text-ios-label mb-3">Background</p>
        <div className="grid grid-cols-4 gap-2">
          {BG_OPTIONS.map((opt) => {
            const isSelected = theme.bgStyle === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setTheme({ ...theme, bgStyle: opt.id })}
                className={cn(
                  'aspect-video rounded-xl flex items-end p-1.5 transition-all',
                  isSelected ? 'ring-2 ring-white/60' : 'opacity-70 hover:opacity-100'
                )}
                style={{ background: BG_PREVIEW[opt.id] }}
              >
                <span className="text-[11px] text-white/80 font-medium leading-none">
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main Settings Panel ─────────────────────────────────────────────────────

export function SettingsPanel({ onClose }: Props) {
  const {
    haAreas,
    customAreas,
    entities,
    entityAreaOverrides,
    resolveEntityArea,
    saveEntityAreaOverrides,
    updateCustomAreas,
    entityIcons,
    theme,
    favorites,
    toggleFavorite,
  } = useHA()

  const [section, setSection] = useState<'areas' | 'appearance'>('areas')
  const [editingArea, setEditingArea] = useState<{ id: string; name: string } | null>(null)
  const [showNewArea, setShowNewArea] = useState(false)
  const [iconPickerEntityId, setIconPickerEntityId] = useState<string | null>(null)

  const accentCls = ACCENT_CLASSES[theme.accent]

  const effectiveEntityArea = useMemo<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {}
    Object.keys(entities).forEach((eid) => {
      map[eid] = resolveEntityArea(eid)
    })
    return map
  }, [entities, resolveEntityArea])

  const allAreas = useMemo(() => [
    ...haAreas.map((a) => ({ area_id: a.area_id, name: a.name })),
    ...customAreas,
  ], [haAreas, customAreas])

  const entityIdsForArea = (areaId: string): string[] =>
    Object.entries(effectiveEntityArea)
      .filter(([, id]) => id === areaId)
      .map(([entityId]) => entityId)
      .filter((eid) => TILE_DOMAINS.has(getDomain(eid)))

  const unassigned = useMemo(() =>
    Object.keys(entities).filter(
      (eid) => TILE_DOMAINS.has(getDomain(eid)) && !effectiveEntityArea[eid]
    ),
    [entities, effectiveEntityArea]
  )

  const handlePickerSave = (areaId: string, selectedIds: string[]) => {
    const selectedSet = new Set(selectedIds)
    const newOverrides: EntityAreaOverrides = { ...entityAreaOverrides }

    Object.keys(entities).forEach((eid) => {
      if (!TILE_DOMAINS.has(getDomain(eid))) return
      const currentArea = effectiveEntityArea[eid]

      if (selectedSet.has(eid)) {
        newOverrides[eid] = areaId
      } else if (currentArea === areaId) {
        newOverrides[eid] = null
      }
    })

    saveEntityAreaOverrides(newOverrides)
    setEditingArea(null)
  }

  const handleAddArea = (name: string) => {
    const newArea: CustomArea = {
      area_id: `custom_${Date.now()}`,
      name,
    }
    updateCustomAreas([...customAreas, newArea])
    setShowNewArea(false)
  }

  const handleDeleteCustomArea = (areaId: string) => {
    const newOverrides: EntityAreaOverrides = { ...entityAreaOverrides }
    Object.keys(entities).forEach((eid) => {
      if (effectiveEntityArea[eid] === areaId) newOverrides[eid] = null
    })
    saveEntityAreaOverrides(newOverrides)
    updateCustomAreas(customAreas.filter((a) => a.area_id !== areaId))
  }

  const isCustomArea = (areaId: string) =>
    customAreas.some((a) => a.area_id === areaId)

  return (
    <div className="min-h-screen bg-ios-bg">
      {/* Header */}
      <header className="sticky top-0 bg-ios-bg z-10 border-b border-ios-separator/50">
        <div className="flex items-center gap-3 px-4 pt-5 pb-3">
          <button
            onClick={onClose}
            className={cn('p-2 -ml-2 rounded-xl active:scale-95 transition-transform', accentCls.text)}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-ios-label flex-1">Settings</h1>
          {section === 'areas' && (
            <button
              onClick={() => setShowNewArea(true)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium active:scale-95 transition-transform',
                accentCls.bgLight, accentCls.text
              )}
            >
              <Plus className="w-4 h-4" />
              New Area
            </button>
          )}
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 px-4 pb-3">
          {(['areas', 'appearance'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-medium transition-all capitalize',
                section === s
                  ? cn('text-ios-label', accentCls.bgLight)
                  : 'text-ios-secondary bg-ios-card-2/50 hover:bg-ios-card-2'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {section === 'appearance' ? (
        <AppearanceSection />
      ) : (
        <div className="px-4 pb-8 space-y-3 mt-3">
          {allAreas.length === 0 ? (
            <div className="text-center py-12 text-ios-secondary">
              <p className="text-base font-medium">No areas found</p>
              <p className="text-sm mt-1 opacity-70">Add a custom area or create areas in Home Assistant</p>
            </div>
          ) : (
            allAreas.map((area) => {
              const areaEntities = entityIdsForArea(area.area_id)
              const custom = isCustomArea(area.area_id)
              return (
                <div key={area.area_id} className="bg-ios-card rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-ios-separator">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ios-label">{area.name}</p>
                      <p className="text-xs text-ios-secondary mt-0.5">
                        {areaEntities.length} {areaEntities.length === 1 ? 'entity' : 'entities'}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingArea({ id: area.area_id, name: area.name })}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ios-card-2 text-xs font-medium active:scale-95 transition-transform',
                        accentCls.text
                      )}
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    {custom && (
                      <button
                        onClick={() => handleDeleteCustomArea(area.area_id)}
                        className="p-1.5 rounded-full text-ios-red active:scale-95 transition-transform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {areaEntities.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-ios-secondary italic">
                      No entities — tap Edit to assign some
                    </p>
                  ) : (
                    <div>
                      {areaEntities.map((eid) => {
                        const entity = entities[eid]
                        if (!entity) return null
                        const label = entityLabel(eid, entity.attributes.friendly_name)
                        const domain = getDomain(eid)
                        const customIconName = entityIcons[eid]
                        const resolvedIcon = customIconName ? getIconByName(customIconName) : null
                        const IconComp: LucideIcon = resolvedIcon ?? getDomainDefaultIcon(domain)
                        return (
                          <div
                            key={eid}
                            className="flex items-center gap-3 px-4 py-2.5 border-b border-ios-separator/40 last:border-0"
                          >
                            {/* Icon button */}
                            <button
                              onClick={() => setIconPickerEntityId(eid)}
                              title="Change icon"
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                                customIconName
                                  ? cn(accentCls.bgLight, accentCls.text)
                                  : 'bg-ios-card-2 text-ios-secondary hover:text-ios-label'
                              )}
                            >
                              <IconComp className="w-4 h-4" />
                            </button>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-ios-label truncate">{label}</p>
                              <p className={cn('text-xs truncate', DOMAIN_COLORS[domain] ?? 'text-ios-secondary')}>
                                {eid}
                              </p>
                            </div>
                            <button
                              onClick={() => toggleFavorite(eid)}
                              title={favorites.includes(eid) ? 'Remove from favorites' : 'Add to favorites'}
                              className={cn(
                                'p-1 transition-colors',
                                favorites.includes(eid) ? 'text-ios-amber' : 'text-ios-secondary hover:text-ios-amber'
                              )}
                            >
                              <Star className={cn('w-4 h-4', favorites.includes(eid) && 'fill-ios-amber')} />
                            </button>
                            <button
                              onClick={() => {
                                const newOverrides = { ...entityAreaOverrides, [eid]: null }
                                saveEntityAreaOverrides(newOverrides)
                              }}
                              className="p-1 text-ios-secondary hover:text-ios-red transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* Unassigned entities */}
          {unassigned.length > 0 && (
            <div className="bg-ios-card rounded-2xl overflow-hidden mt-4">
              <div className="px-4 py-3 border-b border-ios-separator">
                <p className="text-sm font-semibold text-ios-label">Unassigned</p>
                <p className="text-xs text-ios-secondary mt-0.5">{unassigned.length} entities not in any area</p>
              </div>
              {unassigned.map((eid) => {
                const entity = entities[eid]
                if (!entity) return null
                const label = entityLabel(eid, entity.attributes.friendly_name)
                const domain = getDomain(eid)
                const customIconName = entityIcons[eid]
                const resolvedIcon2 = customIconName ? getIconByName(customIconName) : null
                const IconComp: LucideIcon = resolvedIcon2 ?? getDomainDefaultIcon(domain)
                return (
                  <div
                    key={eid}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-ios-separator/40 last:border-0"
                  >
                    <button
                      onClick={() => setIconPickerEntityId(eid)}
                      title="Change icon"
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                        customIconName
                          ? cn(accentCls.bgLight, accentCls.text)
                          : 'bg-ios-card-2 text-ios-secondary hover:text-ios-label'
                      )}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ios-label truncate">{label}</p>
                      <p className={cn('text-xs truncate', DOMAIN_COLORS[domain] ?? 'text-ios-secondary')}>
                        {eid}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(eid)}
                      title={favorites.includes(eid) ? 'Remove from favorites' : 'Add to favorites'}
                      className={cn(
                        'p-1 transition-colors',
                        favorites.includes(eid) ? 'text-ios-amber' : 'text-ios-secondary hover:text-ios-amber'
                      )}
                    >
                      <Star className={cn('w-4 h-4', favorites.includes(eid) && 'fill-ios-amber')} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Entity picker dialog */}
      {editingArea && (
        <EntityPicker
          areaId={editingArea.id}
          areaName={editingArea.name}
          assignedIds={new Set(entityIdsForArea(editingArea.id))}
          onSave={(selected) => handlePickerSave(editingArea.id, selected)}
          onClose={() => setEditingArea(null)}
        />
      )}

      {/* New area dialog */}
      {showNewArea && (
        <NewAreaDialog
          onSave={handleAddArea}
          onClose={() => setShowNewArea(false)}
        />
      )}

      {/* Icon picker dialog */}
      {iconPickerEntityId && (
        <IconPickerDialog
          entityId={iconPickerEntityId}
          onClose={() => setIconPickerEntityId(null)}
        />
      )}
    </div>
  )
}
