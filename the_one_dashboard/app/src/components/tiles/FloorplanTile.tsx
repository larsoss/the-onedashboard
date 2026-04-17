import { useState, useRef, useEffect } from 'react'
import { Map, X, ImagePlus } from 'lucide-react'
import { useHA } from '@/hooks/useHAClient'
import { getDomain, entityLabel } from '@/lib/utils'
import {
  getFloorplans, saveFloorplans,
  type FloorplanConfig, type FloorplanHotspot,
} from '@/lib/floorplan-storage'
import { cn } from '@/lib/utils'

const ACTIVE_COLOR: Record<string, string> = {
  on:        'bg-ios-amber',
  open:      'bg-ios-teal',
  unlocked:  'bg-ios-green',
  locked:    'bg-ios-red',
  playing:   'bg-ios-blue',
  home:      'bg-ios-green',
  off:       'bg-ios-secondary',
  closed:    'bg-ios-secondary',
  idle:      'bg-ios-secondary',
  away:      'bg-ios-secondary',
}

function hotspotColor(state: string): string {
  return ACTIVE_COLOR[state] ?? 'bg-ios-blue'
}

interface FloorplanTileProps {
  /** Unique ID for this floorplan tile (e.g. 'fp_woonkamer') */
  fpId: string
}

export function FloorplanTile({ fpId }: FloorplanTileProps) {
  const { entities, isEditMode, callService, entityLabels, settingsVersion } = useHA()
  const [config, setConfig] = useState<FloorplanConfig>(() => {
    return getFloorplans()[fpId] ?? { imageUrl: '', hotspots: [] }
  })
  const [showImageInput, setShowImageInput] = useState(false)
  const [imageInputValue, setImageInputValue] = useState(config.imageUrl)

  useEffect(() => {
    const cfg = getFloorplans()[fpId] ?? { imageUrl: '', hotspots: [] }
    setConfig(cfg)
    setImageInputValue(cfg.imageUrl)
  }, [settingsVersion, fpId])
  const [pendingHotspot, setPendingHotspot] = useState<{ x: number; y: number } | null>(null)
  const [pendingEntitySearch, setPendingEntitySearch] = useState('')
  const imgRef = useRef<HTMLDivElement>(null)

  const save = (cfg: FloorplanConfig) => {
    setConfig(cfg)
    const all = getFloorplans()
    all[fpId] = cfg
    saveFloorplans(all)
  }

  const handleImageClick = (e: React.MouseEvent) => {
    if (!isEditMode) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPendingHotspot({ x, y })
    setPendingEntitySearch('')
  }

  const addHotspot = (entityId: string) => {
    if (!pendingHotspot) return
    const hs: FloorplanHotspot = {
      id: `hs_${Date.now()}`,
      entityId,
      x: pendingHotspot.x,
      y: pendingHotspot.y,
    }
    save({ ...config, hotspots: [...config.hotspots, hs] })
    setPendingHotspot(null)
  }

  const removeHotspot = (id: string) => {
    save({ ...config, hotspots: config.hotspots.filter((h) => h.id !== id) })
  }

  const handleHotspotClick = (e: React.MouseEvent, hs: FloorplanHotspot) => {
    e.stopPropagation()
    if (isEditMode) {
      removeHotspot(hs.id)
      return
    }
    const entity = entities[hs.entityId]
    if (!entity) return
    const domain = getDomain(hs.entityId)
    const isOn = entity.state === 'on' || entity.state === 'open' || entity.state === 'unlocked'
    if (['light', 'switch', 'input_boolean'].includes(domain)) {
      callService(domain, isOn ? 'turn_off' : 'turn_on', {}, hs.entityId)
    } else if (domain === 'lock') {
      callService('lock', isOn ? 'lock' : 'unlock', {}, hs.entityId)
    } else if (domain === 'cover') {
      callService('cover', isOn ? 'close_cover' : 'open_cover', {}, hs.entityId)
    } else if (domain === 'scene') {
      callService('scene', 'turn_on', {}, hs.entityId)
    }
  }

  // Entity search results
  const searchResults = pendingEntitySearch.length > 0
    ? Object.values(entities)
        .filter((e) => {
          const label = entityLabel(e.entity_id, e.attributes.friendly_name, entityLabels).toLowerCase()
          return label.includes(pendingEntitySearch.toLowerCase()) || e.entity_id.includes(pendingEntitySearch.toLowerCase())
        })
        .slice(0, 8)
    : []

  return (
    <div className="relative rounded-2xl overflow-hidden bg-ios-card" style={{ minHeight: 200 }}>
      {/* Image */}
      {config.imageUrl ? (
        <div ref={imgRef} className="relative w-full" onClick={handleImageClick}>
          <img
            src={config.imageUrl}
            alt="Floorplan"
            className="w-full object-contain select-none"
            draggable={false}
          />
          {/* Hotspots */}
          {config.hotspots.map((hs) => {
            const entity = entities[hs.entityId]
            const state = entity?.state ?? 'unknown'
            const label = entity ? entityLabel(hs.entityId, entity.attributes.friendly_name, entityLabels) : hs.entityId
            return (
              <button
                key={hs.id}
                onClick={(e) => handleHotspotClick(e, hs)}
                className={cn(
                  'absolute w-5 h-5 rounded-full border-2 border-white/70 shadow-lg transition-all',
                  'hover:scale-125 active:scale-95',
                  hotspotColor(state),
                  isEditMode && 'ring-2 ring-ios-red/60 cursor-pointer'
                )}
                style={{ left: `${hs.x}%`, top: `${hs.y}%`, transform: 'translate(-50%,-50%)' }}
                title={`${label}: ${state}`}
              />
            )
          })}
          {/* Edit mode overlay hint */}
          {isEditMode && (
            <div className="absolute inset-x-0 bottom-0 bg-black/50 text-center text-xs text-white py-1">
              Klik om hotspot toe te voegen · Klik op hotspot om te verwijderen
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-2 h-48 text-ios-secondary"
          onClick={isEditMode ? () => setShowImageInput(true) : undefined}
        >
          <Map className="w-10 h-10" />
          {isEditMode
            ? <span className="text-sm">Klik om afbeelding in te stellen</span>
            : <span className="text-sm">Geen plattegrond ingesteld</span>
          }
        </div>
      )}

      {/* Edit mode: image URL button */}
      {isEditMode && config.imageUrl && (
        <button
          onClick={() => setShowImageInput(true)}
          className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/60 text-white"
          title="Afbeelding wijzigen"
        >
          <ImagePlus className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Image URL input modal */}
      {showImageInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowImageInput(false)}>
          <div className="bg-ios-card rounded-3xl p-5 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-ios-label text-sm">Afbeelding URL</p>
            <input
              type="url"
              placeholder="https://..."
              value={imageInputValue}
              onChange={(e) => setImageInputValue(e.target.value)}
              className="w-full bg-ios-card-2 rounded-xl px-3 py-2 text-sm text-ios-label placeholder-ios-secondary outline-none focus:ring-2 focus:ring-ios-blue"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowImageInput(false)} className="px-4 py-2 rounded-xl text-sm text-ios-secondary bg-ios-card-2">Annuleren</button>
              <button
                onClick={() => { save({ ...config, imageUrl: imageInputValue }); setShowImageInput(false) }}
                className="px-4 py-2 rounded-xl text-sm text-white bg-ios-blue"
              >Opslaan</button>
            </div>
          </div>
        </div>
      )}

      {/* Pending hotspot entity picker */}
      {pendingHotspot && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setPendingHotspot(null)}>
          <div className="bg-ios-card rounded-3xl p-5 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ios-label text-sm">Entiteit kiezen</p>
              <button onClick={() => setPendingHotspot(null)}><X className="w-4 h-4 text-ios-secondary" /></button>
            </div>
            <input
              type="text"
              placeholder="Zoek entiteit..."
              value={pendingEntitySearch}
              onChange={(e) => setPendingEntitySearch(e.target.value)}
              className="w-full bg-ios-card-2 rounded-xl px-3 py-2 text-sm text-ios-label placeholder-ios-secondary outline-none focus:ring-2 focus:ring-ios-blue"
              autoFocus
            />
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((e) => (
                <button
                  key={e.entity_id}
                  onClick={() => addHotspot(e.entity_id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-ios-card-2 hover:bg-ios-blue/20 text-left transition-all"
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', hotspotColor(e.state))} />
                  <div>
                    <p className="text-sm text-ios-label">{entityLabel(e.entity_id, e.attributes.friendly_name, entityLabels)}</p>
                    <p className="text-xs text-ios-secondary">{e.entity_id}</p>
                  </div>
                </button>
              ))}
              {pendingEntitySearch && searchResults.length === 0 && (
                <p className="text-xs text-ios-secondary text-center py-2">Geen resultaten</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
