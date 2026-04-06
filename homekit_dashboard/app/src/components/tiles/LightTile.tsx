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
import { getIconByName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { LightAttributes } from '@/types/ha-types'

const COLOR_MODES = new Set(['hs', 'rgb', 'rgbw', 'rgbww', 'xy'])

interface LightTileProps {
  entityId: string
}

export function LightTile({ entityId }: LightTileProps) {
  const entity = useEntity(entityId)
  const { callService, entityIcons } = useHA()

  // Color dialog state
  const [colorOpen, setColorOpen] = useState(false)
  const [localHue, setLocalHue] = useState(30)
  const [localSat, setLocalSat] = useState(80)
  const [localBrightness, setLocalBrightness] = useState(100)
  const [localColorTemp, setLocalColorTemp] = useState(4000)

  // Brightness-only popover (non-color lights)
  const [brightnessOpen, setBrightnessOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [localPopoverBrightness, setLocalPopoverBrightness] = useState(100)

  const colorDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const brightnessDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!entity) return null

  const attrs = entity.attributes as LightAttributes
  const isOn = entity.state === 'on'

  const hasColor = attrs.supported_color_modes?.some((m) => COLOR_MODES.has(m)) ?? false
  const hasColorTemp = attrs.supported_color_modes?.includes('color_temp') ?? false

  const currentHue = attrs.hs_color?.[0] ?? 30
  const currentSat = attrs.hs_color?.[1] ?? 80
  const currentBrightness = brightnessToPercent(attrs.brightness)

  // Min/max color temp in Kelvin
  const minK = attrs.min_color_temp_kelvin ?? (attrs.max_mireds ? miredsToKelvin(attrs.max_mireds) : 2000)
  const maxK = attrs.max_color_temp_kelvin ?? (attrs.min_mireds ? miredsToKelvin(attrs.min_mireds) : 6500)
  const currentTempK = attrs.color_temp_kelvin ?? (attrs.color_temp ? miredsToKelvin(attrs.color_temp) : 4000)

  // Custom tile tint from light color
  const tintRgb = hasColor && isOn && attrs.hs_color
    ? hsvToCssRgb(currentHue, currentSat)
    : undefined

  const CustomIcon = entityIcons[entityId] ? getIconByName(entityIcons[entityId]) : null
  const IconComp = CustomIcon ?? Lightbulb

  const sublabel = isOn
    ? attrs.brightness !== undefined ? `${currentBrightness}%` : 'On'
    : 'Off'

  // ── Color dialog handlers ────────────────────────────────────────────────

  const openColorDialog = useCallback(() => {
    setLocalHue(currentHue)
    setLocalSat(currentSat)
    setLocalBrightness(currentBrightness || 100)
    setLocalColorTemp(currentTempK)
    setColorOpen(true)
  }, [currentHue, currentSat, currentBrightness, currentTempK])

  const sendColor = useCallback(
    (hue: number, sat: number) => {
      if (colorDebounce.current) clearTimeout(colorDebounce.current)
      colorDebounce.current = setTimeout(() => {
        callService('light', 'turn_on', { hs_color: [hue, sat] }, entityId)
      }, 80)
    },
    [callService, entityId]
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
        callService('light', 'turn_on', { brightness: percentToBrightness(pct) }, entityId)
      }, 100)
    },
    [callService, entityId]
  )

  const handleColorTempChange = useCallback(
    (val: number[]) => {
      const k = val[0]
      setLocalColorTemp(k)
      if (colorDebounce.current) clearTimeout(colorDebounce.current)
      colorDebounce.current = setTimeout(() => {
        callService('light', 'turn_on', {
          color_temp_kelvin: k,
          kelvin: k,  // some HA versions use this
        }, entityId)
      }, 100)
    },
    [callService, entityId]
  )

  // ── Brightness-only popover handlers (non-color lights) ──────────────────

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

  // ── Color preset swatches ────────────────────────────────────────────────

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

  const tile = (
    <BaseTile
      isActive={isOn}
      activeColor={tintRgb ? 'none' : 'amber'}
      customTintRgb={tintRgb}
      icon={<IconComp className="w-full h-full" fill={!CustomIcon && isOn ? 'currentColor' : 'none'} />}
      label={entityLabel(entityId, attrs.friendly_name)}
      sublabel={sublabel}
      onClick={hasColor ? openColorDialog : () => callService('light', isOn ? 'turn_off' : 'turn_on', {}, entityId)}
      onLongPress={hasColor ? undefined : handleLongPress}
    />
  )

  // Color lights → Dialog
  if (hasColor) {
    return (
      <>
        {tile}

        <Dialog open={colorOpen} onOpenChange={setColorOpen}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto p-0">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-ios-separator">
              <DialogTitle className="text-base font-semibold text-ios-label">
                {entityLabel(entityId, attrs.friendly_name)}
              </DialogTitle>
              {/* On/off toggle */}
              <button
                onClick={() => callService('light', isOn ? 'turn_off' : 'turn_on', {}, entityId)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  isOn
                    ? 'bg-ios-amber/20 text-ios-amber'
                    : 'bg-ios-card-2 text-ios-secondary'
                )}
              >
                <Power className="w-3.5 h-3.5" />
                {isOn ? 'On' : 'Off'}
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
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
                      const [r,g,b] = hsvToRgb(localHue, localSat, 100)
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
                    const [r,g,b] = hsvToRgb(p.h, p.s, 100)
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
                  min={1}
                  max={100}
                  step={1}
                  value={[localBrightness]}
                  onValueChange={handleDialogBrightnessChange}
                />
              </div>

              {/* Color temperature */}
              {hasColorTemp && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-ios-secondary uppercase tracking-wide">Color Temperature</p>
                    <span className="text-sm text-ios-teal font-medium">{localColorTemp}K</span>
                  </div>
                  <div className="relative">
                    <div
                      className="absolute inset-y-0 left-0 right-0 rounded-full h-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        background: `linear-gradient(to right, #ff8c00, #ffffff, #9dbfff)`,
                        opacity: 0.4,
                      }}
                    />
                    <Slider
                      min={minK}
                      max={maxK}
                      step={100}
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

            <div className="px-5 pb-5">
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
            min={1}
            max={100}
            step={1}
            value={[displayBrightness]}
            onValueChange={handlePopoverBrightnessChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
