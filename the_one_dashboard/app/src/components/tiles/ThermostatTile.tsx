import { useState, useCallback, useEffect, useRef } from 'react'
import { Thermometer } from 'lucide-react'
import { BaseTile } from './BaseTile'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel, formatTemp } from '@/lib/utils'
import { resolveEntityIcon } from '@/lib/icons'
import type { ClimateAttributes } from '@/types/ha-types'
import { cn } from '@/lib/utils'
import { t, type TranslationKey } from '@/lib/i18n'

const HVAC_COLORS: Record<string, string> = {
  heat:     'text-ios-amber',
  cool:     'text-ios-blue',
  heat_cool:'text-ios-purple',
  auto:     'text-ios-green',
  off:      'text-ios-secondary',
  fan_only: 'text-ios-teal',
  dry:      'text-ios-teal',
}

const MODE_LABEL_KEYS: Record<string, TranslationKey> = {
  heat:     'hvac_heat',
  cool:     'hvac_cool',
  heat_cool:'hvac_heat_cool',
  auto:     'hvac_auto',
  fan_only: 'hvac_fan',
  dry:      'hvac_dry',
  off:      'hvac_off',
}

interface ThermostatTileProps {
  entityId: string
}

export function ThermostatTile({ entityId }: ThermostatTileProps) {
  const entity = useEntity(entityId)
  const { callService, entityIcons, entityLabels } = useHA()
  const [open, setOpen] = useState(false)

  // Optimistic temperature — set immediately on press, cleared when HA confirms
  const [localTemp, setLocalTemp] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Derive values safely before the early return so hook count stays stable
  const attrs = (entity?.attributes ?? {}) as ClimateAttributes
  const hvacMode = entity?.state ?? 'off'
  const isActive = hvacMode !== 'off'
  const isHeatCool = hvacMode === 'heat_cool'
  const activeColor = hvacMode === 'heat' ? 'amber' : hvacMode === 'cool' ? 'blue' : 'purple'

  const currentTemp = attrs.current_temperature
  const targetTemp = isHeatCool
    ? attrs.target_temp_high ?? attrs.temperature ?? 20
    : attrs.temperature ?? 20
  const targetLow  = attrs.target_temp_low ?? (targetTemp - 2)
  const step = attrs.target_temp_step ?? 0.5
  const unit = attrs.unit_of_measurement ?? '°C'
  const modes = attrs.hvac_modes ?? []

  // Displayed values — use local (optimistic) when pending, entity value otherwise
  const displayTemp = localTemp !== null ? localTemp : targetTemp
  const displayLow  = localTemp !== null ? localTemp - (targetTemp - targetLow) : targetLow

  // Clear optimistic temp when entity state is updated by HA
  useEffect(() => {
    setLocalTemp(null)
  }, [targetTemp])

  // adjustTemp: update display immediately, debounce the actual HA call
  const adjustTemp = useCallback(
    (delta: number) => {
      const base = localTemp !== null ? localTemp : targetTemp
      const min  = attrs.min_temp ?? 7
      const max  = attrs.max_temp ?? 35

      if (isHeatCool) {
        const gap    = targetTemp - targetLow
        const newHigh = Math.round((base + delta) * (1 / step)) / (1 / step)
        const newLow  = newHigh - gap
        if (newHigh > max || newLow < min) return
        setLocalTemp(newHigh)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          callService('climate', 'set_temperature',
            { target_temp_high: newHigh, target_temp_low: newLow }, entityId)
        }, 300)
      } else {
        const next = Math.round((base + delta) * (1 / step)) / (1 / step)
        if (next < min || next > max) return
        setLocalTemp(next)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          callService('climate', 'set_temperature', { temperature: next }, entityId)
        }, 300)
      }
    },
    [localTemp, targetTemp, targetLow, step, isHeatCool, attrs.min_temp, attrs.max_temp, callService, entityId]
  )

  const setMode = useCallback(
    (mode: string) => {
      callService('climate', 'set_hvac_mode', { hvac_mode: mode }, entityId)
    },
    [callService, entityId]
  )

  if (!entity) return null

  const CustomIcon = resolveEntityIcon(entityIcons, entityId)
  const IconComp = CustomIcon ?? Thermometer

  return (
    <>
      <BaseTile
        isActive={isActive}
        activeColor={activeColor as 'amber' | 'blue' | 'purple'}
        icon={<IconComp className="w-full h-full" />}
        label={entityLabel(entityId, attrs.friendly_name, entityLabels)}
        onClick={() => setOpen(true)}
      >
        {/* Inline ± controls */}
        <div
          data-no-tile-click
          className="flex items-center justify-between gap-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); adjustTemp(-step) }}
            className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white text-base leading-none font-medium active:scale-90 transition-all shrink-0"
            aria-label="Decrease temperature"
          >
            −
          </button>
          <div className="flex flex-col items-center leading-none gap-0.5">
            {isHeatCool ? (
              <span className="text-xs font-bold text-ios-label tabular-nums">
                {formatTemp(displayLow, unit)}–{formatTemp(displayTemp, unit)}
              </span>
            ) : (
              <span className="text-sm font-bold text-ios-label tabular-nums">
                {formatTemp(displayTemp, unit)}
              </span>
            )}
            {currentTemp !== undefined && (
              <span className="text-[10px] text-ios-secondary tabular-nums">
                {formatTemp(currentTemp, unit)}
              </span>
            )}
          </div>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); adjustTemp(step) }}
            className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white text-base leading-none font-medium active:scale-90 transition-all shrink-0"
            aria-label="Increase temperature"
          >
            +
          </button>
        </div>
      </BaseTile>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{entityLabel(entityId, attrs.friendly_name, entityLabels)}</DialogTitle>

          {/* Current temperature */}
          <div className="mt-4 text-center">
            <p className="text-xs text-ios-secondary uppercase tracking-wide">{t('current_temp')}</p>
            <p className="text-4xl font-thin text-ios-label mt-1">
              {formatTemp(currentTemp, unit)}
            </p>
          </div>

          {/* Target temperature */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <button
              onClick={() => adjustTemp(-step)}
              className="w-12 h-12 rounded-full bg-ios-card-2 flex items-center justify-center text-2xl text-ios-label hover:bg-ios-separator active:scale-95 transition-all"
            >
              −
            </button>
            <div className="text-center">
              {isHeatCool ? (
                <>
                  <p className="text-3xl font-light text-ios-label">
                    {formatTemp(displayLow, unit)}–{formatTemp(displayTemp, unit)}
                  </p>
                  <p className="text-xs text-ios-secondary mt-1">{t('target_temp')}</p>
                </>
              ) : (
                <>
                  <p className="text-5xl font-light text-ios-label">{formatTemp(displayTemp, unit)}</p>
                  <p className="text-xs text-ios-secondary mt-1">{t('target_temp')}</p>
                </>
              )}
            </div>
            <button
              onClick={() => adjustTemp(step)}
              className="w-12 h-12 rounded-full bg-ios-card-2 flex items-center justify-center text-2xl text-ios-label hover:bg-ios-separator active:scale-95 transition-all"
            >
              +
            </button>
          </div>

          {/* Mode selector */}
          {modes.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-ios-secondary uppercase tracking-wide mb-3">{t('mode')}</p>
              <div className="flex flex-wrap gap-2">
                {modes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setMode(mode)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      hvacMode === mode
                        ? cn('bg-ios-card-2 border border-white/10', HVAC_COLORS[mode] ?? 'text-ios-label')
                        : 'text-ios-secondary bg-ios-card border border-transparent hover:border-white/5'
                    )}
                  >
                    {MODE_LABEL_KEYS[mode] ? t(MODE_LABEL_KEYS[mode]) : mode}
                  </button>
                ))}
              </div>
            </div>
          )}

          <DialogClose asChild>
            <button className="mt-6 w-full py-3 rounded-2xl bg-ios-card-2 text-ios-label text-sm font-medium hover:bg-ios-separator transition-colors">
              {t('done')}
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
}
