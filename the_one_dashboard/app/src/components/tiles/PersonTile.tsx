import { useState, useMemo } from 'react'
import {
  Home, MapPin, MapPinOff, Battery, BatteryCharging, BatteryLow,
  Wifi, WifiOff, Footprints, Volume2, VolumeX, Vibrate,
  Car, Bike, PersonStanding, Sofa, Settings, X, Search, Music,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel, getDomain } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { getPersonConfigs, savePersonConfigs, type PersonConfig } from '@/lib/person-storage'

// ── Activity icon ─────────────────────────────────────────────────────────────

function ActivityBadge({ state }: { state: string }) {
  const s = state.toLowerCase()
  const icon = (() => {
    if (s === 'in_vehicle' || s === 'automotive') return <Car className="w-3.5 h-3.5" />
    if (s === 'on_bicycle' || s === 'cycling') return <Bike className="w-3.5 h-3.5" />
    if (s === 'running') return <PersonStanding className="w-3.5 h-3.5" />
    if (s === 'still' || s === 'stationary') return <Sofa className="w-3.5 h-3.5" />
    if (s === 'walking' || s === 'on_foot') return <Footprints className="w-3.5 h-3.5" />
    return null
  })()
  if (!icon) return null
  return (
    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-ios-blue/20 text-ios-blue text-[10px]">
      {icon}
    </span>
  )
}

// ── Battery icon ──────────────────────────────────────────────────────────────

function getBatteryColor(level: number): string {
  if (level <= 15) return 'text-ios-red'
  if (level <= 44) return 'text-ios-amber'
  return 'text-ios-green'
}

// ── Sensor row item ───────────────────────────────────────────────────────────

function StatRow({ icon, label, value, className }: {
  icon: React.ReactNode
  label?: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1.5 min-w-0', className)}>
      <span className="shrink-0 text-ios-secondary">{icon}</span>
      <span className="text-xs text-ios-label truncate">{value}</span>
      {label && <span className="text-[10px] text-ios-secondary shrink-0">{label}</span>}
    </div>
  )
}

// ── Config Dialog ─────────────────────────────────────────────────────────────

const CONFIG_FIELDS: Array<{ key: keyof PersonConfig; label: string; hint: string }> = [
  { key: 'batteryLevel',      label: 'Battery Level',       hint: 'sensor.* — battery %' },
  { key: 'batteryState',      label: 'Battery State',       hint: 'sensor.* — charging/discharging' },
  { key: 'wifiSsid',          label: 'WiFi Network',        hint: 'sensor.* — SSID name' },
  { key: 'steps',             label: 'Step Counter',        hint: 'sensor.* — steps today' },
  { key: 'homeProximity',     label: 'Distance from Home',  hint: 'sensor.* — km/miles' },
  { key: 'activity',          label: 'Activity',            hint: 'sensor.* — walking/driving/etc' },
  { key: 'spotify',           label: 'Spotify / Media',     hint: 'media_player.*' },
  { key: 'geocodedLocation',  label: 'Geocoded Location',   hint: 'sensor.* — address attributes' },
  { key: 'ringerMode',        label: 'Ringer Mode',         hint: 'sensor.* — silent/vibrate/normal' },
]

function ConfigDialog({
  entityId,
  config,
  onSave,
  onClose,
}: {
  entityId: string
  config: PersonConfig
  onSave: (cfg: PersonConfig) => void
  onClose: () => void
}) {
  const { entities } = useHA()
  const [draft, setDraft] = useState<PersonConfig>({ ...config })
  const [search, setSearch] = useState('')
  const [activeField, setActiveField] = useState<keyof PersonConfig | null>(null)

  const allEntities = useMemo(() =>
    Object.values(entities)
      .filter((e) => {
        const d = getDomain(e.entity_id)
        return d === 'sensor' || d === 'media_player' || d === 'binary_sensor'
      })
      .sort((a, b) => {
        const la = entityLabel(a.entity_id, a.attributes.friendly_name as string)
        const lb = entityLabel(b.entity_id, b.attributes.friendly_name as string)
        return la.localeCompare(lb)
      }),
    [entities]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allEntities.filter((e) => {
      const label = entityLabel(e.entity_id, e.attributes.friendly_name as string).toLowerCase()
      return label.includes(q) || e.entity_id.toLowerCase().includes(q)
    })
  }, [allEntities, search])

  const pickEntity = (eid: string) => {
    if (!activeField) return
    setDraft((d) => ({ ...d, [activeField]: eid }))
    setActiveField(null)
    setSearch('')
  }

  const clearField = (key: keyof PersonConfig) => {
    setDraft((d) => { const n = { ...d }; delete n[key]; return n })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[85dvh] flex flex-col p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-ios-separator shrink-0">
          <DialogTitle>Configure Person Card</DialogTitle>
          <p className="text-xs text-ios-secondary mt-0.5 truncate">
            {entityLabel(entityId, entities[entityId]?.attributes.friendly_name as string)}
          </p>
        </div>

        {activeField ? (
          /* Entity picker for active field */
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 py-2 border-b border-ios-separator shrink-0">
              <p className="text-xs text-ios-secondary mb-2">
                Picking: <span className="text-ios-label font-medium">
                  {CONFIG_FIELDS.find((f) => f.key === activeField)?.label}
                </span>
              </p>
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
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <button
                onClick={() => { clearField(activeField); setActiveField(null) }}
                className="w-full px-4 py-3 text-left text-sm text-ios-red border-b border-ios-separator/40 hover:bg-ios-card-2"
              >
                — Clear this field
              </button>
              {filtered.map((e) => (
                <button
                  key={e.entity_id}
                  onClick={() => pickEntity(e.entity_id)}
                  className={cn(
                    'w-full flex flex-col px-4 py-2.5 text-left border-b border-ios-separator/30 hover:bg-ios-card-2 last:border-0',
                    draft[activeField] === e.entity_id && 'bg-ios-blue/10'
                  )}
                >
                  <span className="text-sm text-ios-label">
                    {entityLabel(e.entity_id, e.attributes.friendly_name as string)}
                  </span>
                  <span className="text-xs text-ios-secondary">{e.entity_id}</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-ios-separator shrink-0">
              <button
                onClick={() => { setActiveField(null); setSearch('') }}
                className="w-full py-2.5 rounded-xl bg-ios-card-2 text-ios-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Fields list */
          <div className="flex-1 overflow-y-auto">
            {CONFIG_FIELDS.map(({ key, label, hint }) => {
              const val = draft[key]
              const entity = val ? entities[val] : null
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 px-4 py-3 border-b border-ios-separator/40 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ios-label">{label}</p>
                    {val ? (
                      <p className="text-xs text-ios-blue truncate">
                        {entity ? entityLabel(val, entity.attributes.friendly_name as string) : val}
                      </p>
                    ) : (
                      <p className="text-xs text-ios-secondary opacity-60">{hint}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {val && (
                      <button
                        onClick={() => clearField(key)}
                        className="p-1 text-ios-secondary hover:text-ios-red"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setActiveField(key)}
                      className="px-2.5 py-1 rounded-lg bg-ios-card-2 text-xs text-ios-blue font-medium"
                    >
                      {val ? 'Change' : 'Pick'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!activeField && (
          <div className="p-4 border-t border-ios-separator shrink-0">
            <button
              onClick={() => onSave(draft)}
              className="w-full py-3 rounded-2xl bg-ios-blue text-white text-sm font-semibold active:scale-95 transition-all"
            >
              Save
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── PersonTile ────────────────────────────────────────────────────────────────

interface PersonTileProps {
  entityId: string
}

export function PersonTile({ entityId }: PersonTileProps) {
  const { entities, theme } = useHA()
  const [configOpen, setConfigOpen] = useState(false)
  const [config, setConfig] = useState<PersonConfig>(() => getPersonConfigs()[entityId] ?? {})

  const entity = entities[entityId]
  if (!entity) return null

  const isGlass = theme.tileStyle === 'glass'
  const opacity = theme.tileOpacity / 100
  const zone = entity.state   // 'home', 'not_home', or zone name
  const isHome = zone === 'home'
  const isAway = zone === 'not_home'
  const personName = entityLabel(entityId, entity.attributes.friendly_name as string)
  const entityPicture = entity.attributes.entity_picture as string | undefined

  // Linked sensor values
  const battLevel = config.batteryLevel ? entities[config.batteryLevel] : null
  const battState = config.batteryState ? entities[config.batteryState] : null
  const wifiEntity = config.wifiSsid ? entities[config.wifiSsid] : null
  const stepsEntity = config.steps ? entities[config.steps] : null
  const proxEntity = config.homeProximity ? entities[config.homeProximity] : null
  const activityEntity = config.activity ? entities[config.activity] : null
  const spotifyEntity = config.spotify ? entities[config.spotify] : null
  const geoEntity = config.geocodedLocation ? entities[config.geocodedLocation] : null
  const ringerEntity = config.ringerMode ? entities[config.ringerMode] : null

  // Battery
  const battLevelNum = battLevel ? parseFloat(battLevel.state) : null
  const isCharging = battState?.state?.toLowerCase() === 'charging'
  const battColor = battLevelNum !== null ? getBatteryColor(battLevelNum) : 'text-ios-secondary'

  // WiFi
  const wifiName = wifiEntity?.state
  const wifiConnected = wifiName && wifiName !== 'Not Connected' && wifiName !== '<not connected>'

  // Proximity
  const proxRaw = proxEntity ? parseFloat(proxEntity.state) : null
  const proxDisplay = proxRaw !== null && !isNaN(proxRaw)
    ? `${Math.round(proxRaw)} ${(proxEntity!.attributes.unit_of_measurement as string) || 'km'}`
    : null

  // Steps — guard against NaN when sensor returns 'unavailable' or non-numeric
  const stepsRaw = stepsEntity ? parseFloat(stepsEntity.state) : NaN
  const stepsNum = !isNaN(stepsRaw) ? Math.round(stepsRaw) : null

  // Activity
  const activityState = activityEntity?.state ?? ''

  // Ringer
  const ringerState = ringerEntity?.state?.toLowerCase()

  // Spotify
  const spotifyPlaying = spotifyEntity?.state === 'playing'
  const spotifyAttrs = spotifyEntity?.attributes as Record<string, unknown> | undefined
  const spotifyTitle = spotifyAttrs?.media_title as string | undefined
  const spotifyArtist = spotifyAttrs?.media_artist as string | undefined
  const spotifyImg = spotifyAttrs?.entity_picture as string | undefined

  // Geocoded
  const geoAttrs = geoEntity?.attributes as Record<string, unknown> | undefined
  const geoAddress = geoAttrs
    ? [
        geoAttrs['Sub Thoroughfare'] || geoAttrs.sub_thoroughfare,
        geoAttrs['Thoroughfare'] || geoAttrs.thoroughfare,
      ].filter(Boolean).join(' ') ||
      [
        geoAttrs['Locality'] || geoAttrs.locality,
      ].filter(Boolean).join(', ')
    : null

  const handleSave = (cfg: PersonConfig) => {
    setConfig(cfg)
    const all = getPersonConfigs()
    savePersonConfigs({ ...all, [entityId]: cfg })
    setConfigOpen(false)
  }

  const bgStyle: React.CSSProperties = isGlass
    ? {
        background: `rgba(255,255,255,${0.06 * opacity})`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid rgba(255,255,255,${0.10 * opacity})`,
      }
    : { background: `rgba(44,44,46,${opacity})` }

  return (
    <>
      <div
        className="relative rounded-2xl overflow-hidden flex flex-col"
        style={bgStyle}
      >
        {/* Header: photo + name + zone */}
        <div className="flex items-center gap-3 p-3 pb-2">
          {/* Avatar */}
          <div className="relative shrink-0">
            {entityPicture ? (
              <img
                src={entityPicture}
                alt={personName}
                className="w-12 h-12 rounded-full object-cover border-2 border-ios-blue/60"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-ios-blue/20 flex items-center justify-center border-2 border-ios-blue/40">
                <PersonStanding className="w-6 h-6 text-ios-blue" />
              </div>
            )}
            {/* Activity badge */}
            {activityState && (
              <div className="absolute -bottom-0.5 -right-0.5">
                <ActivityBadge state={activityState} />
              </div>
            )}
          </div>

          {/* Name + zone */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ios-label truncate">{personName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {isHome
                ? <Home className="w-3 h-3 text-ios-green shrink-0" />
                : isAway
                ? <MapPinOff className="w-3 h-3 text-ios-secondary shrink-0" />
                : <MapPin className="w-3 h-3 text-ios-amber shrink-0" />
              }
              <span className={cn(
                'text-xs font-medium truncate',
                isHome ? 'text-ios-green' : isAway ? 'text-ios-secondary' : 'text-ios-amber'
              )}>
                {isHome ? 'Home' : isAway ? 'Away' : zone}
              </span>
              {!isHome && proxDisplay && (
                <span className="text-[10px] text-ios-secondary ml-1 truncate">· {proxDisplay}</span>
              )}
            </div>
            {geoAddress && (
              <p className="text-[10px] text-ios-secondary mt-0.5 truncate">{geoAddress}</p>
            )}
          </div>

          {/* Config gear */}
          <button
            onClick={() => setConfigOpen(true)}
            className="p-1.5 rounded-lg text-ios-secondary/50 hover:text-ios-secondary shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 px-3 pb-2">
          {/* Battery */}
          {battLevelNum !== null && (
            <StatRow
              icon={isCharging
                ? <BatteryCharging className="w-3.5 h-3.5 text-ios-green" />
                : battLevelNum <= 20
                ? <BatteryLow className={cn('w-3.5 h-3.5', battColor)} />
                : <Battery className={cn('w-3.5 h-3.5', battColor)} />
              }
              value={`${Math.round(battLevelNum)}%`}
              label={isCharging ? 'charging' : 'battery'}
              className={battColor}
            />
          )}

          {/* Proximity (only shown when not already in header) */}
          {proxDisplay && isHome && (
            <StatRow
              icon={<MapPin className="w-3.5 h-3.5" />}
              value={proxDisplay}
              label="from home"
            />
          )}

          {/* WiFi */}
          {wifiEntity && (
            <StatRow
              icon={wifiConnected
                ? <Wifi className="w-3.5 h-3.5" />
                : <WifiOff className="w-3.5 h-3.5 text-ios-secondary/40" />
              }
              value={wifiConnected ? wifiName! : 'Disconnected'}
              className={!wifiConnected ? 'opacity-40' : undefined}
            />
          )}

          {/* Steps */}
          {stepsNum !== null && (
            <StatRow
              icon={<Footprints className="w-3.5 h-3.5" />}
              value={stepsNum.toLocaleString()}
              label="steps"
            />
          )}

          {/* Ringer */}
          {ringerEntity && ringerState && (
            <StatRow
              icon={
                ringerState === 'silent'
                  ? <VolumeX className="w-3.5 h-3.5 text-ios-red" />
                  : ringerState === 'vibrate'
                  ? <Vibrate className="w-3.5 h-3.5 text-ios-amber" />
                  : <Volume2 className="w-3.5 h-3.5" />
              }
              value={ringerState === 'silent' ? 'Silent' : ringerState === 'vibrate' ? 'Vibrate' : 'Ringing'}
              className={ringerState === 'silent' ? 'text-ios-red' : undefined}
            />
          )}
        </div>

        {/* Spotify bar */}
        {spotifyPlaying && spotifyTitle && (
          <div
            className="flex items-center gap-2 px-3 py-2 mt-auto"
            style={{ background: 'rgba(30,215,96,0.15)' }}
          >
            {spotifyImg && (
              <img
                src={spotifyImg}
                alt="album"
                className="w-7 h-7 rounded object-cover shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <Music className="w-3.5 h-3.5 text-[#1ED760] shrink-0" />
            <p className="text-xs text-ios-label truncate flex-1">
              {spotifyTitle}{spotifyArtist ? ` — ${spotifyArtist}` : ''}
            </p>
          </div>
        )}
      </div>

      {/* Config dialog */}
      {configOpen && (
        <ConfigDialog
          entityId={entityId}
          config={config}
          onSave={handleSave}
          onClose={() => setConfigOpen(false)}
        />
      )}
    </>
  )
}
