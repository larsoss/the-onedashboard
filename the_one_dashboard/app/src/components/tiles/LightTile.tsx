import { useState, useCallback, useRef } from 'react'
import { Lightbulb, Power } from 'lucide-react'
import { BaseTile } from './BaseTile'
import { ColorWheel } from './ColorWheel'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel, brightnessToPercent, percentToBrightness } from '@/lib/utils'
import { hsvToRgb, hsvToCssRgb, miredsToKelvin } from '@/lib/color-utils'
import { resolveEntityIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { LightAttributes } from '@/types/ha-types'

const COLOR_MODES = new Set(['hs', 'rgb', 'rgbw', 'rgbww', 'xy'])

// ── Member card (for light groups) ──────────────────────────────────────────

interface MemberCardProps {
  memberId: string
  isSelected: boolean
  onSelect: () => void
  onCopyColor: (() => void) | null
}

function MemberCard({ memberId, isSelected, onSelect, onCopyColor }: MemberCardProps) {
  const { entities, callService } = useHA()
  const entity = entities[memberId]
  if (!entity) return null

  const attrs = entity.attributes as LightAttributes
  const isOn = entity.state === 'on'
  const hasColor = attrs.supported_color_modes?.some((m) => COLOR_MODES.has(m)) ?? false
  const hue = attrs.hs_color?.[0] ?? 30
  const sat = attrs.hs_color?.[1] ?? 80

  const colorBg = isOn
    ? hasColor && attrs.hs_color
      ? `hsl(${hue},${sat}%,45%)`
      : '#b8860b'
    : 'rgba(50,50,55,0.8)'

  const shortName = entityLabel(memberId, attrs.friendly_name)
    .replace(/^.*?[-–—_]\s*/, '')  // strip prefix like "Woonkamer - "
    || entityLabel(memberId, attrs.friendly_name)

  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-2xl transition-all min-w-[80px] shrink-0',
        isSelected
          ? 'ring-2 ring-ios-amber bg-ios-amber/10'
          : 'bg-ios-card-2 hover:bg-ios-card-2/80'
      )}
    >
      {/* Color circle */}
      <div className="relative">
        <div
          className="w-10 h-10 rounded-full border-2 border-white/20"
          style={{ background: colorBg }}
        />
        {/* On/off dot */}
        <div
          className={cn(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-ios-card-2',
            isOn ? 'bg-ios-green' : 'bg-ios-secondary/40'
          )}
        />
      </div>

      <span className="text-[10px] text-ios-label text-center leading-tight max-w-[72px] truncate">
        {shortName}
      </span>

      {/* Copy color button shown when there's a color to copy and it's not selected */}
      {!isSelected && onCopyColor && isOn && hasColor && attrs.hs_color && (
        <button
          onClick={(e) => { e.stopPropagation(); onCopyColor() }}
          className="text-[9px] text-ios-secondary underline underline-offset-1 hover:text-ios-label"
        >
          copy
        </button>
      )}

      {/* On/off toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          callService('light', isOn ? 'turn_off' : 'turn_on', {}, memberId)
        }}
        className={cn(
          'w-6 h-3.5 rounded-full transition-all relative',
          isOn ? 'bg-ios-amber' : 'bg-ios-secondary/30'
        )}
      >
        <div className={cn(
          'absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all',
          isOn ? 'left-3' : 'left-0.5'
        )} />
      </button>
    </button>
  )
}

// ── Main LightTile ───────────────────────────────────────────────────────────

interface LightTileProps {
  entityId: string
}

export function LightTile({ entityId }: LightTileProps) {
  const entity = useEntity(entityId)
  const { callService, entityIcons, entities } = useHA()

  // Color dialog state
  const [colorOpen, setColorOpen] = useState(false)
  const [localHue, setLocalHue] = useState(30)
  const [localSat, setLocalSat] = useState(80)
  const [localBrightness, setLocalBrightness] = useState(100)
  const [localColorTemp, setLocalColorTemp] = useState(4000)

  // Which group member is being controlled (null = group itself)
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null)

  // Brightness-only popover (non-color lights)
  const [brightnessOpen, setBrightnessOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [localPopoverBrightness, setLocalPopoverBrightness] = useState(100)

  const colorDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const brightnessDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!entity) return null

  const attrs = entity.attributes as LightAttributes
  const isOn = entity.state === 'on'

  // Detect light group: HA puts member entity_id list in attributes
  const rawEntityId = (attrs as Record<string, unknown>).entity_id
  const memberIds: string[] | null = Array.isArray(rawEntityId)
    ? (rawEntityId as string[]).filter((id) => typeof id === 'string')
    : null
  const isGroup = memberIds !== null && memberIds.length > 0

  const hasColor = attrs.supported_color_modes?.some((m) => COLOR_MODES.has(m)) ?? false
  const hasColorTemp = attrs.supported_color_modes?.includes('color_temp') ?? false

  const currentHue = attrs.hs_color?.[0] ?? 30
  const currentSat = attrs.hs_color?.[1] ?? 80
  const currentBrightness = brightnessToPercent(attrs.brightness)

  const minK = attrs.min_color_temp_kelvin ?? (attrs.max_mireds ? miredsToKelvin(attrs.max_mireds) : 2000)
  const maxK = attrs.max_color_temp_kelvin ?? (attrs.min_mireds ? miredsToKelvin(attrs.min_mireds) : 6500)
  const currentTempK = attrs.color_temp_kelvin ?? (attrs.color_temp ? miredsToKelvin(attrs.color_temp) : 4000)

  const tintRgb = hasColor && isOn && attrs.hs_color
    ? hsvToCssRgb(currentHue, currentSat)
    : undefined

  const CustomIcon = resolveEntityIcon(entityIcons, entityId)
  const IconComp = CustomIcon ?? Lightbulb

  const sublabel = isOn
    ? attrs.brightness !== undefined ? `${currentBrightness}%` : 'On'
    : 'Off'

  // The entity ID that color/brightness commands go to
  const controlId = activeMemberId ?? entityId

  // Helper: get attrs for the currently controlled entity
  const getControlAttrs = (): LightAttributes => {
    if (!activeMemberId) return attrs
    return (entities[activeMemberId]?.attributes ?? {}) as LightAttributes
  }

  // ── Color dialog handlers ────────────────────────────────────────────────

  const openColorDialog = useCallback(() => {
    setActiveMemberId(null)
    setLocalHue(currentHue)
    setLocalSat(currentSat)
    setLocalBrightness(currentBrightness || 100)
    setLocalColorTemp(currentTempK)
    setColorOpen(true)
  }, [currentHue, currentSat, currentBrightness, currentTempK])

  const selectMember = useCallback((memberId: string) => {
    const memberEntity = entities[memberId]
    if (!memberEntity) return
    const mAttrs = memberEntity.attributes as LightAttributes
    setActiveMemberId(memberId)
    setLocalHue(mAttrs.hs_color?.[0] ?? 30)
    setLocalSat(mAttrs.hs_color?.[1] ?? 80)
    setLocalBrightness(brightnessToPercent(mAttrs.brightness) || 100)
    setLocalColorTemp(
      mAttrs.color_temp_kelvin ??
      (mAttrs.color_temp ? miredsToKelvin(mAttrs.color_temp) : 4000)
    )
  }, [entities])

  const copyMemberColor = useCallback((fromId: string) => {
    const fromEntity = entities[fromId]
    if (!fromEntity) return
    const fromAttrs = fromEntity.attributes as LightAttributes
    if (!fromAttrs.hs_color) return
    const [h, s] = fromAttrs.hs_color
    setLocalHue(h)
    setLocalSat(s)
    if (colorDebounce.current) clearTimeout(colorDebounce.current)
    colorDebounce.current = setTimeout(() => {
      callService('light', 'turn_on', { hs_color: [h, s] }, controlId)
    }, 80)
  }, [entities, callService, controlId])

  const sendColor = useCallback(
    (hue: number, sat: number) => {
      if (colorDebounce.current) clearTimeout(colorDebounce.current)
      colorDebounce.current = setTimeout(() => {
        callService('light', 'turn_on', { hs_color: [hue, sat] }, controlId)
      }, 80)
    },
    [callService, controlId]
  )

  const handleColorChange = useCallback(
    (hue: number, sat: number) => {
      setLocalHue(hue)
      setLocalSat(sat)
      sendColor(hue, sat)
    },
    [sendColor]
  )

  const handleDialogBrightnessChange = useCallback(
    (val: number[]) => {
      const pct = val[0]
      setLocalBrightness(pct)
      if (colorDebounce.current) clearTimeout(colorDebounce.current)
      colorDebounce.current = setTimeout(() => {
        callService('light', 'turn_on', { brightness: percentToBrightness(pct) }, controlId)
      }, 100)
    },
    [callService, controlId]
  )

  const handleColorTempChange = useCallback(
    (val: number[]) => {
      const k = val[0]
      setLocalColorTemp(k)
      if (colorDebounce.current) clearTimeout(colorDebounce.current)
      colorDebounce.current = setTimeout(() => {
        callService('light', 'turn_on', { color_temp_kelvin: k, kelvin: k }, controlId)
      }, 100)
    },
    [callService, controlId]
  )

  // ── Brightness-only popover handlers ────────────────────────────────────

  const handleLongPress = useCallback(() => {
    setLocalPopoverBrightness(currentBrightness || 100)
    setBrightnessOpen(true)
  }, [currentBrightness])

  const handlePopoverBrightnessChange = useCallback(
    (val: number[]) => {
      const pct = val[0]
      setLocalPopoverBrightness(pct)
      setIsDragging(true)
      if (brightnessDebounce.current) clearTimeout(brightnessDebounce.current)
      brightnessDebounce.current = setTimeout(() => {
        callService('light', 'turn_on', { brightness: percentToBrightness(pct) }, entityId)
        setIsDragging(false)
      }, 150)
    },
    [callService, entityId]
  )

  const displayBrightness = isDragging ? localPopoverBrightness : currentBrightness

  // ── Color presets ────────────────────────────────────────────────────────

  const presets: Array<{ label: string; h: number; s: number }> = [
    { label: 'Warm', h: 30, s: 80 },
    { label: 'Cool', h: 200, s: 60 },
    { label: 'Red', h: 0, s: 100 },
    { label: 'Green', h: 120, s: 100 },
    { label: 'Blue', h: 240, s: 100 },
    { label: 'Purple', h: 280, s: 90 },
    { label: 'Pink', h: 330, s: 80 },
    { label: 'White', h: 30, s: 5 },
  ]

  // ── Determine color temp range for control target ────────────────────────

  const controlAttrs = getControlAttrs()
  const controlMinK = controlAttrs.min_color_temp_kelvin ?? minK
  const controlMaxK = controlAttrs.max_color_temp_kelvin ?? maxK
  const controlHasColorTemp = controlAttrs.supported_color_modes?.includes('color_temp') ?? hasColorTemp

  // ── Active target label ──────────────────────────────────────────────────

  const activeLabel = activeMemberId
    ? entityLabel(activeMemberId, (entities[activeMemberId]?.attributes as LightAttributes)?.friendly_name)
    : entityLabel(entityId, attrs.friendly_name)

  const tile = (
    <BaseTile
      isActive={isOn}
      activeColor={tintRgb ? 'none' : 'amber'}
      customTintRgb={tintRgb}
      icon={<IconComp className="w-full h-full" fill={!CustomIcon && isOn ? 'currentColor' : 'none'} />}
      label={entityLabel(entityId, attrs.friendly_name)}
      sublabel={sublabel}
      onClick={hasColor ? openColorDialog : () => callService('light', isOn ? 'turn_off' : 'turn_on', {}, entityId)}
      onLongPress={hasColor ? openColorDialog : handleLongPress}
    >
      {/* Brightness bar — visible when light is on and brightness is known */}
      {isOn && attrs.brightness !== undefined && (
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${currentBrightness}%`,
              background: tintRgb
                ? `rgba(${tintRgb}, 0.85)`
                : 'rgba(255,159,10,0.85)',
            }}
          />
        </div>
      )}
    </BaseTile>
  )

  // Color lights → Dialog
  if (hasColor) {
    return (
      <>
        {tile}

        <Dialog open={colorOpen} onOpenChange={setColorOpen}>
          <DialogContent hideClose className="max-h-[90dvh] overflow-y-auto p-0 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-ios-separator shrink-0">
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold text-ios-label truncate">
                  {entityLabel(entityId, attrs.friendly_name)}
                </DialogTitle>
                {isGroup && activeMemberId && (
                  <p className="text-xs text-ios-secondary truncate mt-0.5">{activeLabel}</p>
                )}
              </div>
              <button
                onClick={() => callService('light', isOn ? 'turn_off' : 'turn_on', {}, entityId)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all shrink-0 ml-3',
                  isOn
                    ? 'bg-ios-amber/20 text-ios-amber'
                    : 'bg-ios-card-2 text-ios-secondary'
                )}
              >
                <Power className="w-3.5 h-3.5" />
                {isOn ? 'On' : 'Off'}
              </button>
            </div>

            <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">
              {/* Color wheel */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-full max-w-[280px] mx-auto">
                  <ColorWheel
                    hue={localHue}
                    saturation={localSat}
                    onChange={handleColorChange}
                  />
                </div>
                {/* Selected color preview */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white/30"
                    style={{ background: `hsl(${localHue},${localSat}%,50%)` }}
                  />
                  <span className="text-xs text-ios-secondary">
                    {(() => {
                      const [r, g, b] = hsvToRgb(localHue, localSat, 100)
                      return `rgb(${r}, ${g}, ${b})`
                    })()}
                  </span>
                </div>
              </div>

              {/* Color presets */}
              <div>
                <p className="text-xs text-ios-secondary uppercase tracking-wide mb-2">Presets</p>
                <div className="flex gap-2 flex-wrap">
                  {presets.map((p) => {
                    const [r, g, b] = hsvToRgb(p.h, p.s, 100)
                    return (
                      <button
                        key={p.label}
                        onClick={() => handleColorChange(p.h, p.s)}
                        className="flex flex-col items-center gap-1"
                        title={p.label}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                            Math.abs(localHue - p.h) < 5 && localSat > 50 === p.s > 20
                              ? 'border-white scale-110'
                              : 'border-white/20'
                          )}
                          style={{ background: `rgb(${r},${g},${b})` }}
                        />
                        <span className="text-[10px] text-ios-secondary">{p.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Brightness */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-ios-secondary uppercase tracking-wide">Brightness</p>
                  <span className="text-sm text-ios-amber font-medium">{localBrightness}%</span>
                </div>
                <Slider
                  min={1} max={100} step={1}
                  value={[localBrightness]}
                  onValueChange={handleDialogBrightnessChange}
                />
              </div>

              {/* Color temperature */}
              {controlHasColorTemp && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-ios-secondary uppercase tracking-wide">Color Temperature</p>
                    <span className="text-sm text-ios-teal font-medium">{localColorTemp}K</span>
                  </div>
                  <div className="relative">
                    <div
                      className="absolute inset-y-0 left-0 right-0 rounded-full h-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40"
                      style={{ background: `linear-gradient(to right, #ff8c00, #ffffff, #9dbfff)` }}
                    />
                    <Slider
                      min={controlMinK} max={controlMaxK} step={100}
                      value={[localColorTemp]}
                      onValueChange={handleColorTempChange}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-ios-secondary">Warm</span>
                    <span className="text-[10px] text-ios-secondary">Cool</span>
                  </div>
                </div>
              )}
            </div>

            {/* Group member cards */}
            {isGroup && memberIds && memberIds.length > 0 && (
              <div className="border-t border-ios-separator shrink-0 px-5 pt-3 pb-2">
                <p className="text-xs text-ios-secondary uppercase tracking-wide mb-2">
                  Lights ({memberIds.length})
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {memberIds.map((memberId) => (
                    <MemberCard
                      key={memberId}
                      memberId={memberId}
                      isSelected={activeMemberId === memberId}
                      onSelect={() => selectMember(memberId)}
                      onCopyColor={
                        activeMemberId !== null && activeMemberId !== memberId
                          ? () => copyMemberColor(memberId)
                          : null
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="px-5 pb-5 pt-2 shrink-0">
              <DialogClose asChild>
                <button className="w-full py-3 rounded-2xl bg-ios-card-2 text-ios-label text-sm font-medium">
                  Done
                </button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Non-color lights → brightness popover on long press
  return (
    <Popover open={brightnessOpen} onOpenChange={setBrightnessOpen}>
      <PopoverAnchor asChild>
        {tile}
      </PopoverAnchor>
      <PopoverContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ios-label">
              {entityLabel(entityId, attrs.friendly_name)}
            </span>
            <span className="text-sm text-ios-amber font-medium">{displayBrightness}%</span>
          </div>
          <Slider
            min={1} max={100} step={1}
            value={[displayBrightness]}
            onValueChange={handlePopoverBrightnessChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
