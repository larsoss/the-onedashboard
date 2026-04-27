import { useState, useMemo } from 'react'
import {
  Lightbulb, ToggleRight, Thermometer, Lock, ChevronsUpDown,
  Activity, Camera, CalendarDays, Cloud, Music, Wand2, Zap,
  FileText, User, Clock, Search, X, Check, ChevronRight, ArrowLeft,
} from 'lucide-react'
import { useHA } from '@/hooks/useHAClient'
import { getDomain, entityLabel, cn } from '@/lib/utils'
import type { WidgetType, WidgetInstance } from '@/lib/widget-storage'
import { defaultWidgetSpan, makeWidgetId } from '@/lib/widget-storage'
import type { LucideIcon } from 'lucide-react'

// ── Widget type definitions ───────────────────────────────────────────────────

interface WidgetTypeDef {
  type: WidgetType
  label: string
  icon: LucideIcon
  color: string
  domains: string[]
  multiEntity?: boolean
  noEntity?: boolean
}

const WIDGET_TYPE_DEFS: WidgetTypeDef[] = [
  { type: 'light',        label: 'Light',        icon: Lightbulb,      color: '#FF9F0A', domains: ['light'],                      multiEntity: true },
  { type: 'switch',       label: 'Switch',        icon: ToggleRight,    color: '#0A84FF', domains: ['switch', 'input_boolean'] },
  { type: 'climate',      label: 'Climate',       icon: Thermometer,    color: '#FF6347', domains: ['climate'] },
  { type: 'lock',         label: 'Lock',          icon: Lock,           color: '#FF453A', domains: ['lock'] },
  { type: 'cover',        label: 'Cover',         icon: ChevronsUpDown, color: '#5AC8FA', domains: ['cover'] },
  { type: 'sensor',       label: 'Sensor',        icon: Activity,       color: '#8E8E93', domains: ['sensor', 'binary_sensor'],   multiEntity: false },
  { type: 'camera',       label: 'Camera',        icon: Camera,         color: '#30D158', domains: ['camera'] },
  { type: 'calendar',     label: 'Calendar',      icon: CalendarDays,   color: '#BF5AF2', domains: ['calendar'] },
  { type: 'weather',      label: 'Weather',       icon: Cloud,          color: '#34AADC', domains: ['weather'] },
  { type: 'media_player', label: 'Media Player',  icon: Music,          color: '#FF2D55', domains: ['media_player'] },
  { type: 'scene',        label: 'Scene',         icon: Wand2,          color: '#FF9F0A', domains: ['scene'] },
  { type: 'automation',   label: 'Automation',    icon: Zap,            color: '#30D158', domains: ['automation'] },
  { type: 'script',       label: 'Script',        icon: FileText,       color: '#5AC8FA', domains: ['script'] },
  { type: 'person',       label: 'Person',        icon: User,           color: '#0A84FF', domains: ['person'] },
  { type: 'clock',        label: 'Clock',         icon: Clock,          color: '#BF5AF2', domains: [],                            noEntity: true },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface WidgetPickerProps {
  onAdd: (widget: WidgetInstance) => void
  onClose: () => void
}

// ── WidgetPicker ──────────────────────────────────────────────────────────────

export function WidgetPicker({ onAdd, onClose }: WidgetPickerProps) {
  const { entities, entityLabels } = useHA()
  const [step, setStep] = useState<'type' | 'entity'>('type')
  const [selectedDef, setSelectedDef] = useState<WidgetTypeDef | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState('')
  const [search, setSearch] = useState('')

  // Step 1: filter widget types by search
  const filteredDefs = useMemo(() => {
    if (!search) return WIDGET_TYPE_DEFS
    const q = search.toLowerCase()
    return WIDGET_TYPE_DEFS.filter((d) => d.label.toLowerCase().includes(q))
  }, [search])

  // Step 2: available entities for selected widget type
  const availableEntities = useMemo(() => {
    if (!selectedDef || selectedDef.noEntity) return []
    const q = search.toLowerCase()
    return Object.values(entities)
      .filter((e) => {
        if (!selectedDef.domains.includes(getDomain(e.entity_id))) return false
        if (!q) return true
        const lbl = entityLabel(e.entity_id, e.attributes.friendly_name, entityLabels).toLowerCase()
        return lbl.includes(q) || e.entity_id.toLowerCase().includes(q)
      })
      .sort((a, b) =>
        entityLabel(a.entity_id, a.attributes.friendly_name, entityLabels)
          .localeCompare(entityLabel(b.entity_id, b.attributes.friendly_name, entityLabels))
      )
  }, [entities, entityLabels, selectedDef, search])

  const handleTypeSelect = (def: WidgetTypeDef) => {
    setSelectedDef(def)
    setSearch('')
    setSelectedIds(new Set())
    if (def.noEntity) {
      setStep('entity') // entity step shows just title + save
    } else {
      setStep('entity')
    }
  }

  const toggleEntity = (id: string) => {
    if (!selectedDef) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (selectedDef.multiEntity) {
        next.add(id)
      } else {
        next.clear()
        next.add(id)
      }
      return next
    })
  }

  const handleSave = () => {
    if (!selectedDef) return
    if (!selectedDef.noEntity && selectedIds.size === 0) return
    const entityIds = Array.from(selectedIds)
    const widget: WidgetInstance = {
      id: makeWidgetId(),
      type: selectedDef.type,
      entityIds,
      title: title.trim() || undefined,
      span: defaultWidgetSpan(selectedDef.type, entityIds.length),
    }
    onAdd(widget)
    onClose()
  }

  const canSave = selectedDef?.noEntity ? true : selectedIds.size > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-ios-card rounded-t-3xl sm:rounded-3xl w-full max-w-sm max-h-[85dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
          {step === 'entity' && (
            <button
              onClick={() => { setStep('type'); setSearch(''); setSelectedIds(new Set()) }}
              className="p-1.5 rounded-lg hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 text-ios-secondary" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ios-label">
              {step === 'type' ? 'Add Widget' : selectedDef?.label ?? 'Add Widget'}
            </p>
            <p className="text-xs text-ios-secondary mt-0.5">
              {step === 'type'
                ? `Choose a widget type · ${WIDGET_TYPE_DEFS.length} available`
                : selectedDef?.noEntity
                  ? 'Configure widget'
                  : selectedDef?.multiEntity
                    ? 'Select one or more entities'
                    : 'Select an entity'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
            <X className="w-4 h-4 text-ios-secondary" />
          </button>
        </div>

        {/* Search bar */}
        {(step === 'type' || (!selectedDef?.noEntity && step === 'entity')) && (
          <div className="px-4 pt-3 pb-1 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10">
              <Search className="w-4 h-4 text-ios-secondary shrink-0" />
              <input
                type="text"
                placeholder={step === 'type' ? 'Search widget types…' : 'Search entities…'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-ios-label placeholder:text-ios-secondary outline-none"
                autoFocus={step === 'type'}
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X className="w-3.5 h-3.5 text-ios-secondary" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Widget type grid */}
          {step === 'type' && (
            <div className="grid grid-cols-2 gap-2 p-4">
              {filteredDefs.map((def) => {
                const Icon = def.icon
                return (
                  <button
                    key={def.type}
                    onClick={() => handleTypeSelect(def)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-95"
                    style={{ background: `${def.color}22`, border: `1px solid ${def.color}44` }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${def.color}33` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: def.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ios-label leading-tight truncate">
                        {def.label}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-ios-secondary ml-auto shrink-0" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 2: Entity selector + title */}
          {step === 'entity' && selectedDef && (
            <div className="flex flex-col">
              {/* Entity list (not for clock) */}
              {!selectedDef.noEntity && (
                <div className="px-4 pt-2 space-y-0.5">
                  {availableEntities.length === 0 && (
                    <p className="text-center text-xs text-ios-secondary py-6">
                      No {selectedDef.label.toLowerCase()} entities found
                    </p>
                  )}
                  {availableEntities.map((e) => {
                    const isSelected = selectedIds.has(e.entity_id)
                    const lbl = entityLabel(e.entity_id, e.attributes.friendly_name, entityLabels)
                    return (
                      <button
                        key={e.entity_id}
                        onClick={() => toggleEntity(e.entity_id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                          isSelected ? 'bg-ios-blue/20' : 'hover:bg-white/10',
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                            selectedDef.multiEntity
                              ? isSelected ? 'border-ios-blue bg-ios-blue' : 'border-white/30'
                              : isSelected ? 'border-ios-blue bg-ios-blue' : 'border-white/30',
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ios-label truncate">{lbl}</p>
                          <p className="text-xs text-ios-secondary truncate">{e.entity_id}</p>
                        </div>
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded-md shrink-0',
                            e.state === 'on' || e.state === 'home'
                              ? 'bg-ios-green/20 text-ios-green'
                              : 'bg-white/10 text-ios-secondary',
                          )}
                        >
                          {e.state}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Title field */}
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-semibold text-ios-secondary uppercase tracking-wider mb-2">
                  Label (optional)
                </p>
                <input
                  type="text"
                  placeholder={
                    selectedIds.size > 0
                      ? entityLabel(
                          Array.from(selectedIds)[0],
                          entities[Array.from(selectedIds)[0]]?.attributes.friendly_name,
                          entityLabels,
                        )
                      : selectedDef.label
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/10 text-sm text-ios-label placeholder:text-ios-secondary outline-none border border-white/10 focus:border-ios-blue"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer — save button in step 2 */}
        {step === 'entity' && (
          <div className="px-4 pb-5 pt-2 border-t border-white/10 shrink-0">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={cn(
                'w-full py-3 rounded-xl text-sm font-semibold transition-colors',
                canSave
                  ? 'bg-ios-blue text-white'
                  : 'bg-white/10 text-ios-secondary cursor-not-allowed',
              )}
            >
              {canSave
                ? `Add ${selectedDef?.label ?? 'Widget'}`
                : 'Select an entity'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
