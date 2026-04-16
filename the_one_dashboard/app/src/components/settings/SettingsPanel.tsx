import { useState, useMemo } from 'react'
import {
  ArrowLeft, Plus, Pencil, Trash2, Search, X, Check, Star,
  EyeOff, Eye, ChevronDown,
} from 'lucide-react'
import {
  Lightbulb, ToggleRight, Thermometer, Lock, Blinds, Activity,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel, getDomain } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { ICON_OPTIONS, resolveEntityIcon } from '@/lib/icons'
import { t } from '@/lib/i18n'
import {
  accentHex,
  accentHsla,
  COLOR_MOODS,
  BG_VALUES,
  type ColorMood,
  type TileStyle,
  type TileSize,
  type TileShape,
  type IconSize,
  type ThemeConfig,
} from '@/lib/theme-storage'
import type { CustomArea, EntityAreaOverrides } from '@/lib/area-storage'
import type { HassEntity } from '@/types/ha-types'

const TILE_DOMAINS = new Set([
  'light', 'switch', 'input_boolean', 'climate', 'lock', 'cover', 'sensor', 'binary_sensor', 'person',
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

const DOMAIN_ICON_BG: Record<string, string> = {
  light:          'bg-ios-amber/20 text-ios-amber',
  switch:         'bg-ios-blue/20 text-ios-blue',
  input_boolean:  'bg-ios-blue/20 text-ios-blue',
  climate:        'bg-ios-amber/20 text-ios-amber',
  lock:           'bg-ios-red/20 text-ios-red',
  cover:          'bg-ios-teal/20 text-ios-teal',
  sensor:         'bg-white/5 text-ios-secondary',
  binary_sensor:  'bg-white/5 text-ios-secondary',
  person:         'bg-ios-green/20 text-ios-green',
  automation:     'bg-ios-amber/20 text-ios-amber',
  script:         'bg-ios-blue/20 text-ios-blue',
  scene:          'bg-ios-green/20 text-ios-green',
  media_player:   'bg-ios-blue/20 text-ios-blue',
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

// Human-readable domain names
const DOMAIN_LABEL: Record<string, string> = {
  light: 'Lamp', switch: 'Schakelaar', input_boolean: 'Schakelaar',
  climate: 'Thermostaat', lock: 'Slot', cover: 'Jaloezie',
  sensor: 'Sensor', binary_sensor: 'Sensor', person: 'Persoon',
  automation: 'Automatisering', script: 'Script', scene: 'Scène',
  media_player: 'Media', camera: 'Camera', calendar: 'Kalender',
}

// Display order of domain groups within an area card
const DOMAIN_ORDER = [
  'light', 'switch', 'input_boolean', 'climate', 'lock', 'cover',
  'media_player', 'camera', 'scene', 'automation', 'script',
  'person', 'sensor', 'binary_sensor', 'calendar',
]

// For the domain filter bar: groups equivalent domains together
const DOMAIN_FILTER_EQUIV: Record<string, string[]> = {
  light:  ['light'],
  switch: ['switch', 'input_boolean'],
  climate: ['climate'],
  lock:   ['lock'],
  cover:  ['cover'],
  sensor: ['sensor', 'binary_sensor'],
}

const FILTER_PILLS: Array<{ key: string; label: string; Icon: LucideIcon }> = [
  { key: 'light',   label: 'Lampen',     Icon: Lightbulb  },
  { key: 'switch',  label: 'Schakelaars',Icon: ToggleRight },
  { key: 'climate', label: 'Klimaat',    Icon: Thermometer },
  { key: 'lock',    label: 'Sloten',     Icon: Lock        },
  { key: 'cover',   label: 'Jaloezieën', Icon: Blinds      },
  { key: 'sensor',  label: 'Sensoren',   Icon: Activity    },
]

function getStateDisplay(entity: HassEntity, domain: string): { label: string; color: string } {
  const s = entity.state
  const a = entity.attributes as Record<string, unknown>
  if (domain === 'light')
    return s === 'on' ? { label: 'Aan', color: 'text-ios-amber' } : { label: 'Uit', color: 'text-ios-secondary/50' }
  if (domain === 'switch' || domain === 'input_boolean')
    return s === 'on' ? { label: 'Aan', color: 'text-ios-blue' } : { label: 'Uit', color: 'text-ios-secondary/50' }
  if (domain === 'climate') {
    const temp = a.current_temperature
    return { label: temp !== undefined ? `${temp}°` : s, color: 'text-ios-amber' }
  }
  if (domain === 'lock')
    return s === 'locked'
      ? { label: 'Vergrendeld', color: 'text-ios-red' }
      : { label: 'Ontgrendeld', color: 'text-ios-green' }
  if (domain === 'cover')
    return s === 'open' || s === 'opening'
      ? { label: 'Open', color: 'text-ios-teal' }
      : { label: 'Gesloten', color: 'text-ios-secondary/50' }
  if (domain === 'binary_sensor')
    return s === 'on' ? { label: 'Actief', color: 'text-ios-blue' } : { label: 'Inactief', color: 'text-ios-secondary/50' }
  if (domain === 'sensor') {
    const unit = a.unit_of_measurement as string | undefined
    return { label: unit ? `${s} ${unit}` : s, color: 'text-ios-secondary' }
  }
  if (domain === 'person')
    return s === 'home' ? { label: 'Thuis', color: 'text-ios-green' } : { label: 'Weg', color: 'text-ios-secondary/50' }
  if (domain === 'automation')
    return s === 'on' ? { label: 'Actief', color: 'text-ios-amber' } : { label: 'Inactief', color: 'text-ios-secondary/50' }
  if (domain === 'media_player')
    return s === 'playing' ? { label: 'Speelt', color: 'text-ios-green' } : { label: s, color: 'text-ios-secondary/50' }
  return { label: s, color: 'text-ios-secondary/50' }
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
  const { entities, entityLabels } = useHA()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedIds))

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return Object.values(entities)
      .filter((e) => TILE_DOMAINS.has(getDomain(e.entity_id)))
      .filter((e) => {
        const label = entityLabel(e.entity_id, e.attributes.friendly_name, entityLabels).toLowerCase()
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
          <DialogTitle>{t('edit_area_title', { area: areaName })}</DialogTitle>
          <p className="text-xs text-ios-secondary mt-0.5">{t('n_ent_selected', { n: selected.size })}</p>
        </div>

        <div className="px-4 py-2 border-b border-ios-separator">
          <div className="flex items-center gap-2 bg-ios-card-2 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-ios-secondary shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder={t('search_entities')}
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
            <p className="text-center text-ios-secondary text-sm py-10">{t('no_ent_found')}</p>
          ) : (
            filtered.map((entity) => {
              const isChecked = selected.has(entity.entity_id)
              const domain = getDomain(entity.entity_id)
              const label = entityLabel(entity.entity_id, entity.attributes.friendly_name, entityLabels)
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
            {t('save')}
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
        <DialogTitle>{t('new_area')}</DialogTitle>
        <input
          autoFocus
          type="text"
          placeholder={t('area_name_ph')}
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
            {t('cancel')}
          </button>
          <button
            onClick={() => { if (name.trim()) onSave(name.trim()) }}
            disabled={!name.trim()}
            className="flex-1 py-3 rounded-2xl bg-ios-blue text-white text-sm font-semibold disabled:opacity-40 active:scale-95 transition-all"
          >
            {t('add')}
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
          <DialogTitle>{t('choose_icon')}</DialogTitle>
          <p className="text-xs text-ios-secondary mt-0.5">
            {selected ? t('icon_selected', { name: selected }) : t('icon_tap_hint')}
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
            {t('reset')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-ios-blue text-white text-sm font-semibold active:scale-95 transition-all"
          >
            {t('save')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Appearance Section ──────────────────────────────────────────────────────

const TILE_STYLE_OPTIONS: () => Array<{ id: TileStyle; label: string; desc: string }> = () => [
  { id: 'glass', label: t('glass'), desc: t('glass_desc') },
  { id: 'solid', label: t('solid'), desc: t('solid_desc') },
]

// ── Mood Picker ─────────────────────────────────────────────────────────────

interface MoodPickerProps {
  theme: ThemeConfig
  onApply: (mood: ColorMood) => void
}

function MoodPicker({ theme, onApply }: MoodPickerProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-ios-secondary uppercase tracking-wider mb-3 px-1">
        Color Mood
      </p>
      <div className="grid grid-cols-2 gap-3">
        {COLOR_MOODS.map((mood) => {
          const isActive = theme.moodId === mood.id
          return (
            <button
              key={mood.id}
              onClick={() => onApply(mood)}
              className={cn(
                'relative rounded-2xl overflow-hidden text-left transition-all active:scale-[0.97]',
                isActive
                  ? 'ring-2 ring-white/70 shadow-lg shadow-black/40'
                  : 'ring-1 ring-white/10 hover:ring-white/25'
              )}
              style={{ background: BG_VALUES[mood.bgStyle], minHeight: 88 }}
            >
              {/* Dark gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

              {/* Accent top bar */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: `hsl(${mood.accent}, 80%, 60%)` }}
              />

              {/* Active checkmark */}
              {isActive && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow">
                  <Check className="w-3 h-3 text-black" strokeWidth={3} />
                </div>
              )}

              <div className="relative p-3 pt-3.5 flex flex-col justify-between h-full">
                {/* Swatches */}
                <div className="flex gap-1 mb-2">
                  {mood.swatches.slice(0, 4).map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-md shrink-0 border border-white/15"
                      style={{ background: color }}
                    />
                  ))}
                </div>
                {/* Labels */}
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{mood.name}</p>
                  <p className="text-[10px] text-white/60 mt-0.5 leading-tight">{mood.desc}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const TILE_SIZE_OPTIONS: () => Array<{ id: TileSize; label: string; desc: string }> = () => [
  { id: 'compact', label: t('size_compact'), desc: t('size_compact_desc') },
  { id: 'normal',  label: t('size_normal'),  desc: t('size_normal_desc') },
  { id: 'large',   label: t('size_large'),   desc: t('size_large_desc') },
]

const TILE_SHAPE_OPTIONS: () => Array<{ id: TileShape; label: string }> = () => [
  { id: 'square', label: t('shape_square') },
  { id: 'rect',   label: t('shape_rect') },
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
  accentHue,
}: {
  label: string
  options: Array<{ id: T; label: string; desc?: string }>
  value: T
  onChange: (v: T) => void
  accentHue: number
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-ios-secondary uppercase tracking-wider mb-2">{label}</p>
      <div className="bg-black/20 rounded-xl p-1 flex gap-0.5">
        {options.map((opt) => {
          const isSelected = value === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={cn(
                'flex-1 py-2 px-1 rounded-lg flex flex-col items-center gap-0.5 text-sm font-medium transition-all',
                isSelected
                  ? 'text-ios-label shadow-sm'
                  : 'text-ios-secondary hover:text-ios-label/70'
              )}
              style={isSelected ? { background: accentHsla(accentHue, 0.25) } : undefined}
            >
              <span>{opt.label}</span>
              {opt.desc && (
                <span className={cn('text-[10px] font-normal', isSelected ? 'text-ios-secondary' : 'text-ios-secondary/60')}>
                  {opt.desc}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const HEADER_STORAGE_KEY = 'hk_hide_ha_header'

// Minified JS injected via browser_mod.javascript into the HA parent frame
const HIDE_HEADER_CODE =
  `(function(){try{var sr=document.querySelector('home-assistant')` +
  `?.shadowRoot?.querySelector('home-assistant-main')?.shadowRoot;` +
  `if(!sr)return;` +
  `if(!window.__todHH){window.__todHH=new CSSStyleSheet();` +
  `window.__todHH.replaceSync('app-header,.header{display:none!important}');}` +
  `if(!sr.adoptedStyleSheets.includes(window.__todHH))` +
  `sr.adoptedStyleSheets=[...sr.adoptedStyleSheets,window.__todHH];` +
  `}catch(e){}})();`

const SHOW_HEADER_CODE =
  `(function(){try{var sr=document.querySelector('home-assistant')` +
  `?.shadowRoot?.querySelector('home-assistant-main')?.shadowRoot;` +
  `if(sr&&window.__todHH)` +
  `sr.adoptedStyleSheets=sr.adoptedStyleSheets.filter(function(s){return s!==window.__todHH;});` +
  `}catch(e){}})();`

function AppearanceSection() {
  const { theme, setTheme, callService } = useHA()
  const hue = theme.accent

  const [headerHidden, setHeaderHidden] = useState(() =>
    localStorage.getItem(HEADER_STORAGE_KEY) === 'true'
  )

  const toggleHeader = () => {
    const next = !headerHidden
    setHeaderHidden(next)
    localStorage.setItem(HEADER_STORAGE_KEY, String(next))
    callService('browser_mod', 'javascript', { code: next ? HIDE_HEADER_CODE : SHOW_HEADER_CODE })
  }

  const applyMood = (mood: ColorMood) => {
    setTheme({
      ...theme,
      accent: mood.accent,
      bgStyle: mood.bgStyle,
      tileStyle: mood.tileStyle,
      tileOpacity: mood.tileOpacity,
      moodId: mood.id,
    })
  }

  return (
    <div className="px-4 pb-8 space-y-5 mt-1">
      {/* Color Mood picker */}
      <MoodPicker theme={theme} onApply={applyMood} />

      {/* Fine-tune section */}
      <div>
        <p className="text-xs font-semibold text-ios-secondary uppercase tracking-wider mb-3 px-1">
          Fine-tune
        </p>

      {/* Fine-tune: accent hue */}
      <div className="bg-ios-card rounded-2xl p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-ios-label">{t('accent_color')}</p>
          <div
            className="w-6 h-6 rounded-full border-2 border-white/20 shrink-0"
            style={{ background: accentHex(hue) }}
          />
        </div>
        {/* Rainbow hue bar */}
        <div className="relative h-5 rounded-full overflow-hidden" style={{
          background: 'linear-gradient(to right, hsl(0,80%,60%), hsl(30,80%,60%), hsl(60,80%,60%), hsl(90,80%,60%), hsl(120,80%,60%), hsl(150,80%,60%), hsl(180,80%,60%), hsl(210,80%,60%), hsl(240,80%,60%), hsl(270,80%,60%), hsl(300,80%,60%), hsl(330,80%,60%), hsl(360,80%,60%))'
        }}>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={hue}
            onChange={(e) => setTheme({ ...theme, accent: Number(e.target.value), moodId: undefined })}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md pointer-events-none transition-all"
            style={{ left: `calc(${(hue / 360) * 100}% - 10px)`, background: accentHex(hue) }}
          />
        </div>
      </div>

      {/* Tile style, shape, size, icon */}
      <div className="bg-ios-card rounded-2xl p-4 space-y-4">
        <OptionRow
          label={t('tile_style')}
          options={TILE_STYLE_OPTIONS()}
          value={theme.tileStyle}
          onChange={(v) => setTheme({ ...theme, tileStyle: v, moodId: undefined })}
          accentHue={hue}
        />
        <OptionRow
          label={t('tile_shape')}
          options={TILE_SHAPE_OPTIONS()}
          value={theme.tileShape}
          onChange={(v) => setTheme({ ...theme, tileShape: v })}
          accentHue={hue}
        />
        <OptionRow
          label={t('tile_size')}
          options={TILE_SIZE_OPTIONS()}
          value={theme.tileSize}
          onChange={(v) => setTheme({ ...theme, tileSize: v })}
          accentHue={hue}
        />
        <OptionRow
          label={t('icon_size')}
          options={ICON_SIZE_OPTIONS}
          value={theme.iconSize}
          onChange={(v) => setTheme({ ...theme, iconSize: v })}
          accentHue={hue}
        />
      </div>

      {/* Opacity */}
      <div className="bg-ios-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-ios-label">{t('tile_opacity')}</p>
          <span className="text-sm font-medium" style={{ color: accentHex(hue) }}>{theme.tileOpacity}%</span>
        </div>
        <Slider
          min={10}
          max={100}
          step={5}
          value={[theme.tileOpacity]}
          onValueChange={([v]) => setTheme({ ...theme, tileOpacity: v, moodId: undefined })}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[11px] text-ios-secondary">{t('transparent')}</span>
          <span className="text-[11px] text-ios-secondary">{t('opaque')}</span>
        </div>
      </div>
      </div>{/* end fine-tune section */}

      {/* Browser Mod */}
      <div>
        <p className="text-xs font-semibold text-ios-secondary uppercase tracking-wider mb-3 px-1">
          Browser Mod
        </p>
        <div className="bg-ios-card rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ios-label">Verberg HA topbar</p>
              <p className="text-xs text-ios-secondary mt-1 leading-snug">
                Verbergt de witte balk bovenaan. Vereist de{' '}
                <span className="text-ios-label/70 font-medium">Browser Mod</span> integratie.
              </p>
            </div>
            <button
              onClick={toggleHeader}
              aria-label="Topbar aan/uit"
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0',
                headerHidden ? 'bg-ios-green' : 'bg-white/20'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200',
                  headerHidden ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
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
    entityLabels,
    saveEntityLabel,
    theme,
    favorites,
    toggleFavorite,
    hiddenEntities,
    toggleHideEntity,
  } = useHA()

  const [section, setSection] = useState<'areas' | 'appearance'>('areas')
  const [editingArea, setEditingArea] = useState<{ id: string; name: string } | null>(null)
  const [showNewArea, setShowNewArea] = useState(false)
  const [iconPickerEntityId, setIconPickerEntityId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState<string | null>(null)
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set())
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [editingLabelValue, setEditingLabelValue] = useState('')

  const startEditLabel = (eid: string, fallback: string) => {
    setEditingLabelId(eid)
    setEditingLabelValue(entityLabels[eid] ?? fallback)
  }
  const commitLabel = (eid: string) => {
    saveEntityLabel(eid, editingLabelValue)
    setEditingLabelId(null)
  }

  const toggleAreaCollapse = (areaId: string) =>
    setCollapsedAreas((prev) => {
      const next = new Set(prev)
      if (next.has(areaId)) next.delete(areaId); else next.add(areaId)
      return next
    })

  const hue = theme.accent

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

  // Visible (non-hidden) domain-supported entities in an area
  const entityIdsForArea = (areaId: string): string[] =>
    Object.entries(effectiveEntityArea)
      .filter(([, id]) => id === areaId)
      .map(([entityId]) => entityId)
      .filter((eid) => TILE_DOMAINS.has(getDomain(eid)) && !hiddenEntities.includes(eid))

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

  // Search filtering
  const q = search.toLowerCase()

  const filteredAreas = useMemo(() => {
    let areas = allAreas
    // Domain filter: only show areas that contain at least one entity of that domain
    if (domainFilter) {
      const equiv = DOMAIN_FILTER_EQUIV[domainFilter] ?? [domainFilter]
      areas = areas.filter((area) =>
        entityIdsForArea(area.area_id).some((eid) => equiv.includes(getDomain(eid)))
      )
    }
    if (!q) return areas
    return areas.filter((area) => {
      if (area.name.toLowerCase().includes(q)) return true
      return entityIdsForArea(area.area_id).some((eid) => {
        const e = entities[eid]
        const lbl = entityLabel(eid, e?.attributes.friendly_name).toLowerCase()
        return lbl.includes(q) || eid.toLowerCase().includes(q)
      })
    })
  }, [allAreas, effectiveEntityArea, entities, q, domainFilter])

  const filteredEntityIdsForArea = (areaId: string): string[] => {
    let ids = entityIdsForArea(areaId)
    // Domain filter
    if (domainFilter) {
      const equiv = DOMAIN_FILTER_EQUIV[domainFilter] ?? [domainFilter]
      ids = ids.filter((eid) => equiv.includes(getDomain(eid)))
    }
    if (!q) return ids
    return ids.filter((eid) => {
      const e = entities[eid]
      const lbl = entityLabel(eid, e?.attributes.friendly_name).toLowerCase()
      return lbl.includes(q) || eid.toLowerCase().includes(q)
    })
  }

  const filteredHidden = useMemo(() => {
    if (!q) return hiddenEntities
    return hiddenEntities.filter((eid) => {
      const e = entities[eid]
      const lbl = entityLabel(eid, e?.attributes.friendly_name).toLowerCase()
      return lbl.includes(q) || eid.toLowerCase().includes(q)
    })
  }, [hiddenEntities, entities, q])

  const filteredUnassigned = useMemo(() => {
    if (!q) return unassigned
    return unassigned.filter((eid) => {
      const e = entities[eid]
      const lbl = entityLabel(eid, e?.attributes.friendly_name).toLowerCase()
      return lbl.includes(q) || eid.toLowerCase().includes(q)
    })
  }, [unassigned, entities, q])

  return (
    <div className="min-h-screen bg-ios-bg">
      {/* Header */}
      <header className="sticky top-0 bg-ios-bg z-10 border-b border-ios-separator/50">
        <div className="flex items-center gap-3 px-4 pt-5 pb-3">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-xl active:scale-95 transition-transform"
            style={{ color: accentHex(hue) }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-ios-label flex-1">{t('settings')}</h1>
          {section === 'areas' && (
            <button
              onClick={() => setShowNewArea(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium active:scale-95 transition-transform"
              style={{ background: accentHsla(hue, 0.2), color: accentHex(hue) }}
            >
              <Plus className="w-4 h-4" />
              {t('new_area')}
            </button>
          )}
        </div>

        {/* Section tabs — iOS segmented control */}
        <div className="mx-4 mb-3 bg-black/25 rounded-xl p-1 flex gap-0.5">
          {(['areas', 'appearance'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setSection(s); setSearch('') }}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all',
                section === s
                  ? 'text-ios-label shadow-sm'
                  : 'text-ios-secondary hover:text-ios-label/70'
              )}
              style={section === s ? { background: accentHsla(hue, 0.3) } : undefined}
            >
              {s === 'areas' ? t('areas_tab') : t('appearance_tab')}
            </button>
          ))}
        </div>

        {/* Search + domain filter — areas section only */}
        {section === 'areas' && (
          <div className="px-4 pb-2 space-y-2">
            {/* Search bar */}
            <div className="flex items-center gap-2 bg-ios-card-2 rounded-xl px-3 py-2.5">
              <Search className="w-4 h-4 text-ios-secondary shrink-0" />
              <input
                type="text"
                placeholder={t('search_areas')}
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

            {/* Domain filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                onClick={() => setDomainFilter(null)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  !domainFilter
                    ? 'text-white shadow-sm'
                    : 'bg-white/8 text-ios-secondary hover:text-ios-label'
                )}
                style={!domainFilter ? { background: accentHsla(hue, 0.7) } : undefined}
              >
                Alle
              </button>
              {FILTER_PILLS.map(({ key, label, Icon }) => {
                const active = domainFilter === key
                return (
                  <button
                    key={key}
                    onClick={() => setDomainFilter(active ? null : key)}
                    className={cn(
                      'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                      active
                        ? 'text-white shadow-sm'
                        : 'bg-white/8 text-ios-secondary hover:text-ios-label'
                    )}
                    style={active ? { background: accentHsla(hue, 0.7) } : undefined}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {section === 'appearance' ? (
        <AppearanceSection />
      ) : (
        <div className="px-4 pb-8 space-y-2.5 mt-2">
          {filteredAreas.length === 0 && !q && !domainFilter ? (
            <div className="text-center py-12 text-ios-secondary">
              <p className="text-base font-medium">{t('no_areas')}</p>
              <p className="text-sm mt-1 opacity-70">{t('no_areas_hint')}</p>
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="text-center py-12 text-ios-secondary">
              <p className="text-base font-medium">{q ? t('no_results', { q: search }) : 'Geen kamers gevonden'}</p>
            </div>
          ) : (
            filteredAreas.map((area) => {
              const areaEntityIds = filteredEntityIdsForArea(area.area_id)
              const totalCount = entityIdsForArea(area.area_id).length
              const custom = isCustomArea(area.area_id)
              const isCollapsed = collapsedAreas.has(area.area_id)

              // Group entities by domain, preserving DOMAIN_ORDER
              const grouped = DOMAIN_ORDER
                .map((domain) => ({
                  domain,
                  ids: areaEntityIds.filter((eid) => getDomain(eid) === domain),
                }))
                .filter((g) => g.ids.length > 0)

              return (
                <div key={area.area_id} className="bg-ios-card rounded-2xl overflow-hidden">
                  {/* Area header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none"
                    onClick={() => toggleAreaCollapse(area.area_id)}
                  >
                    {/* Collapse chevron */}
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-ios-secondary/60 transition-transform duration-200 shrink-0',
                        isCollapsed && '-rotate-90'
                      )}
                    />

                    {/* Area initial avatar */}
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold text-white"
                      style={{ background: accentHsla(hue, 0.4) }}
                    >
                      {area.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + count */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ios-label truncate">{area.name}</p>
                      <p className="text-xs text-ios-secondary mt-0.5">
                        {totalCount} {totalCount === 1 ? 'entiteit' : 'entiteiten'}
                        {hiddenEntities.filter((eid) =>
                          Object.entries(effectiveEntityArea).some(([e, a]) => e === eid && a === area.area_id)
                        ).length > 0 && (
                          <span className="ml-1.5 text-ios-red/70">
                            · {hiddenEntities.filter((eid) =>
                              Object.entries(effectiveEntityArea).some(([e, a]) => e === eid && a === area.area_id)
                            ).length} verborgen
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingArea({ id: area.area_id, name: area.name }) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform shrink-0"
                      style={{ background: accentHsla(hue, 0.15), color: accentHex(hue) }}
                    >
                      <Pencil className="w-3 h-3" />
                      {t('edit_btn')}
                    </button>

                    {/* Delete (custom areas only) */}
                    {custom && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCustomArea(area.area_id) }}
                        className="p-1.5 rounded-full text-ios-secondary/50 hover:text-ios-red active:scale-95 transition-all shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Entity list — collapsible */}
                  {!isCollapsed && (
                    <div className="border-t border-ios-separator/40">
                      {areaEntityIds.length === 0 ? (
                        <p className="px-4 py-4 text-xs text-ios-secondary/60 italic text-center">
                          {domainFilter ? 'Geen entiteiten van dit type' : t('no_area_entities')}
                        </p>
                      ) : (
                        grouped.map(({ domain, ids }, groupIdx) => {
                          const DomainIcon = getDomainDefaultIcon(domain)
                          const domainBg = DOMAIN_ICON_BG[domain] ?? 'bg-white/5 text-ios-secondary'
                          return (
                            <div key={domain}>
                              {/* Domain group header — only shown when no domain filter active */}
                              {!domainFilter && grouped.length > 1 && (
                                <div className={cn(
                                  'flex items-center gap-2 px-4 py-2',
                                  groupIdx > 0 ? 'border-t border-ios-separator/30' : '',
                                  'bg-white/[0.02]'
                                )}>
                                  <div className={cn('w-5 h-5 rounded-md flex items-center justify-center', domainBg)}>
                                    <DomainIcon className="w-3 h-3" />
                                  </div>
                                  <span className="text-[11px] font-semibold text-ios-secondary uppercase tracking-wider">
                                    {DOMAIN_LABEL[domain] ?? domain}
                                  </span>
                                  <span className="ml-auto text-[11px] text-ios-secondary/50">{ids.length}</span>
                                </div>
                              )}

                              {/* Entity rows */}
                              {ids.map((eid, idx) => {
                                const entity = entities[eid]
                                if (!entity) return null
                                const label = entityLabel(eid, entity.attributes.friendly_name, entityLabels)
                                const hasCustomIcon = Boolean(entityIcons[eid])
                                const IconComp: LucideIcon = resolveEntityIcon(entityIcons, eid) ?? getDomainDefaultIcon(domain)
                                const isFav = favorites.includes(eid)
                                const { label: stateLabel, color: stateColor } = getStateDisplay(entity, domain)
                                const isLast = idx === ids.length - 1

                                return (
                                  <div
                                    key={eid}
                                    className={cn(
                                      'flex items-center gap-3 px-4 py-3.5',
                                      !isLast && 'border-b border-ios-separator/30'
                                    )}
                                  >
                                    {/* Domain-colored icon — tap to change */}
                                    <button
                                      onClick={() => setIconPickerEntityId(eid)}
                                      title="Pictogram wijzigen"
                                      className={cn(
                                        'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95',
                                        !hasCustomIcon && domainBg
                                      )}
                                      style={hasCustomIcon ? { background: accentHsla(hue, 0.25), color: accentHex(hue) } : undefined}
                                    >
                                      <IconComp className="w-4.5 h-4.5" />
                                    </button>

                                    {/* Name + state */}
                                    <div className="flex-1 min-w-0">
                                      {editingLabelId === eid ? (
                                        <input
                                          autoFocus
                                          type="text"
                                          value={editingLabelValue}
                                          onChange={(e) => setEditingLabelValue(e.target.value)}
                                          onBlur={() => commitLabel(eid)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') commitLabel(eid)
                                            if (e.key === 'Escape') setEditingLabelId(null)
                                          }}
                                          placeholder={entityLabel(eid, entity.attributes.friendly_name)}
                                          className="text-sm font-medium bg-ios-card-2 rounded-lg px-2 py-0.5 outline-none border border-white/15 text-ios-label w-full"
                                        />
                                      ) : (
                                        <button
                                          onClick={() => startEditLabel(eid, entityLabel(eid, entity.attributes.friendly_name))}
                                          className="flex items-center gap-1 min-w-0 text-left group w-full"
                                        >
                                          <span className={cn(
                                            'text-sm font-medium truncate leading-tight',
                                            entityLabels[eid] ? 'text-white' : 'text-ios-label'
                                          )}>
                                            {label}
                                          </span>
                                          <Pencil className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
                                        </button>
                                      )}
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.07] text-ios-secondary/70 font-medium">
                                          {DOMAIN_LABEL[domain] ?? domain}
                                        </span>
                                        <span className={cn('text-[11px] font-semibold', stateColor)}>
                                          {stateLabel}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Favorite */}
                                    <button
                                      onClick={() => toggleFavorite(eid)}
                                      title={isFav ? t('rem_favorites') : t('add_favorites')}
                                      className={cn(
                                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90',
                                        isFav ? 'bg-ios-amber/15 text-ios-amber' : 'text-ios-secondary/40 hover:text-ios-amber'
                                      )}
                                    >
                                      <Star className={cn('w-4 h-4', isFav && 'fill-ios-amber')} />
                                    </button>

                                    {/* Hide / show */}
                                    <button
                                      onClick={() => toggleHideEntity(eid)}
                                      title="Verbergen"
                                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-ios-secondary/40 hover:text-ios-red transition-all active:scale-90"
                                    >
                                      <EyeOff className="w-4 h-4" />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* Hidden entities */}
          {filteredHidden.length > 0 && (
            <div className="bg-ios-card rounded-2xl overflow-hidden mt-2">
              <div className="px-4 py-3.5 border-b border-ios-separator/40 flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/8 flex items-center justify-center shrink-0">
                  <EyeOff className="w-4 h-4 text-ios-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-ios-label">{t('hidden_section')}</p>
                  <p className="text-xs text-ios-secondary mt-0.5">{t('hidden_count', { n: hiddenEntities.length })}</p>
                </div>
              </div>
              {filteredHidden.map((eid, idx) => {
                const entity = entities[eid]
                const label = entity ? entityLabel(eid, entity.attributes.friendly_name) : eid
                const domain = getDomain(eid)
                const domainBg = DOMAIN_ICON_BG[domain] ?? 'bg-white/5 text-ios-secondary'
                const IconComp = getDomainDefaultIcon(domain)
                const isLast = idx === filteredHidden.length - 1
                return (
                  <div
                    key={eid}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5',
                      !isLast && 'border-b border-ios-separator/30'
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 opacity-40', domainBg)}>
                      <IconComp className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ios-secondary truncate">{label}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.07] text-ios-secondary/60 font-medium">
                        {DOMAIN_LABEL[domain] ?? domain}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleHideEntity(eid)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95"
                      style={{ background: accentHsla(hue, 0.15), color: accentHex(hue) }}
                    >
                      <Eye className="w-3 h-3" />
                      {t('show')}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Unassigned entities */}
          {filteredUnassigned.length > 0 && (
            <div className="bg-ios-card rounded-2xl overflow-hidden mt-2">
              <div className="px-4 py-3.5 border-b border-ios-separator/40">
                <p className="text-sm font-bold text-ios-label">{t('unassigned')}</p>
                <p className="text-xs text-ios-secondary mt-0.5">{t('unassigned_hint', { n: unassigned.length })}</p>
              </div>
              {filteredUnassigned.map((eid, idx) => {
                const entity = entities[eid]
                if (!entity) return null
                const label = entityLabel(eid, entity.attributes.friendly_name, entityLabels)
                const domain = getDomain(eid)
                const hasCustomIcon = Boolean(entityIcons[eid])
                const IconComp: LucideIcon = resolveEntityIcon(entityIcons, eid) ?? getDomainDefaultIcon(domain)
                const domainBg = DOMAIN_ICON_BG[domain] ?? 'bg-white/5 text-ios-secondary'
                const isFav = favorites.includes(eid)
                const { label: stateLabel, color: stateColor } = getStateDisplay(entity, domain)
                const isLast = idx === filteredUnassigned.length - 1
                return (
                  <div
                    key={eid}
                    className={cn('flex items-center gap-3 px-4 py-3.5', !isLast && 'border-b border-ios-separator/30')}
                  >
                    <button
                      onClick={() => setIconPickerEntityId(eid)}
                      className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95', !hasCustomIcon && domainBg)}
                      style={hasCustomIcon ? { background: accentHsla(hue, 0.25), color: accentHex(hue) } : undefined}
                    >
                      <IconComp className="w-4.5 h-4.5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingLabelId === eid ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingLabelValue}
                          onChange={(e) => setEditingLabelValue(e.target.value)}
                          onBlur={() => commitLabel(eid)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitLabel(eid)
                            if (e.key === 'Escape') setEditingLabelId(null)
                          }}
                          placeholder={entityLabel(eid, entity.attributes.friendly_name)}
                          className="text-sm font-medium bg-ios-card-2 rounded-lg px-2 py-0.5 outline-none border border-white/15 text-ios-label w-full"
                        />
                      ) : (
                        <button
                          onClick={() => startEditLabel(eid, entityLabel(eid, entity.attributes.friendly_name))}
                          className="flex items-center gap-1 min-w-0 text-left group w-full"
                        >
                          <span className={cn(
                            'text-sm font-medium truncate',
                            entityLabels[eid] ? 'text-white' : 'text-ios-label'
                          )}>
                            {label}
                          </span>
                          <Pencil className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
                        </button>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.07] text-ios-secondary/70 font-medium">
                          {DOMAIN_LABEL[domain] ?? domain}
                        </span>
                        <span className={cn('text-[11px] font-semibold', stateColor)}>{stateLabel}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(eid)}
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90',
                        isFav ? 'bg-ios-amber/15 text-ios-amber' : 'text-ios-secondary/40 hover:text-ios-amber'
                      )}
                    >
                      <Star className={cn('w-4 h-4', isFav && 'fill-ios-amber')} />
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
