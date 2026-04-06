import { useState, useMemo } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, Search, X, Check } from 'lucide-react'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel, getDomain } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { CustomArea, EntityAreaOverrides } from '@/lib/area-storage'

// Domains shown in entity picker
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

        {/* Search */}
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

        {/* Entity list */}
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

        {/* Save button */}
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
  } = useHA()

  const [editingArea, setEditingArea] = useState<{ id: string; name: string } | null>(null)
  const [showNewArea, setShowNewArea] = useState(false)

  // Build the effective area map using the resolver (override → entity → device)
  const effectiveEntityArea = useMemo<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {}
    Object.keys(entities).forEach((eid) => {
      map[eid] = resolveEntityArea(eid)
    })
    return map
  }, [entities, resolveEntityArea])

  // All areas (HA + custom)
  const allAreas = useMemo(() => [
    ...haAreas.map((a) => ({ area_id: a.area_id, name: a.name })),
    ...customAreas,
  ], [haAreas, customAreas])

  // Entities assigned to each area
  const entityIdsForArea = (areaId: string): string[] =>
    Object.entries(effectiveEntityArea)
      .filter(([, id]) => id === areaId)
      .map(([entityId]) => entityId)
      .filter((eid) => TILE_DOMAINS.has(getDomain(eid)))

  // Unassigned entities
  const unassigned = useMemo(() =>
    Object.keys(entities).filter(
      (eid) => TILE_DOMAINS.has(getDomain(eid)) && !effectiveEntityArea[eid]
    ),
    [entities, effectiveEntityArea]
  )

  // Save entity picker result
  const handlePickerSave = (areaId: string, selectedIds: string[]) => {
    const selectedSet = new Set(selectedIds)
    const newOverrides: EntityAreaOverrides = { ...entityAreaOverrides }

    // For every entity in existing tiles domains:
    // - if it was in THIS area and now NOT selected → unassign
    // - if it WAS NOT in this area and IS selected → assign here
    Object.keys(entities).forEach((eid) => {
      if (!TILE_DOMAINS.has(getDomain(eid))) return
      const currentArea = effectiveEntityArea[eid]

      if (selectedSet.has(eid)) {
        // Assign to this area
        newOverrides[eid] = areaId
      } else if (currentArea === areaId) {
        // Was in this area but deselected → unassign
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
    // Unassign entities from this area
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
      <header className="flex items-center gap-3 px-4 pt-5 pb-3 sticky top-0 bg-ios-bg z-10">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-xl text-ios-blue active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-ios-label flex-1">Settings</h1>
        <button
          onClick={() => setShowNewArea(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ios-blue/20 text-ios-blue text-sm font-medium active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          New Area
        </button>
      </header>

      <div className="px-4 pb-8 space-y-3">
        {/* Areas */}
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
                {/* Area header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-ios-separator">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ios-label">{area.name}</p>
                    <p className="text-xs text-ios-secondary mt-0.5">
                      {areaEntities.length} {areaEntities.length === 1 ? 'entity' : 'entities'}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingArea({ id: area.area_id, name: area.name })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ios-card-2 text-ios-blue text-xs font-medium active:scale-95 transition-transform"
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

                {/* Entity list */}
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
                      return (
                        <div
                          key={eid}
                          className="flex items-center justify-between px-4 py-2.5 border-b border-ios-separator/40 last:border-0"
                        >
                          <div>
                            <p className="text-sm text-ios-label">{label}</p>
                            <p className={cn('text-xs', DOMAIN_COLORS[domain] ?? 'text-ios-secondary')}>
                              {eid}
                            </p>
                          </div>
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
              return (
                <div
                  key={eid}
                  className="flex items-center px-4 py-2.5 border-b border-ios-separator/40 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ios-label truncate">{label}</p>
                    <p className={cn('text-xs truncate', DOMAIN_COLORS[domain] ?? 'text-ios-secondary')}>
                      {eid}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
    </div>
  )
}
