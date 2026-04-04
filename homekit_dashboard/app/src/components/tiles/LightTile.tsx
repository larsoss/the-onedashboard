import { useState, useCallback, useRef } from 'react'
import { Lightbulb } from 'lucide-react'
import { BaseTile } from './BaseTile'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel, brightnessToPercent, percentToBrightness } from '@/lib/utils'
import type { LightAttributes } from '@/types/ha-types'

interface LightTileProps {
  entityId: string
}

export function LightTile({ entityId }: LightTileProps) {
  const entity = useEntity(entityId)
  const { callService } = useHA()
  const [open, setOpen] = useState(false)
  const [localBrightness, setLocalBrightness] = useState(100)
  const [isDragging, setIsDragging] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!entity) return null

  const attrs = entity.attributes as LightAttributes
  const isOn = entity.state === 'on'
  const brightness = isDragging
    ? localBrightness
    : brightnessToPercent(attrs.brightness)

  const sublabel = isOn
    ? attrs.brightness !== undefined ? `${brightnessToPercent(attrs.brightness)}%` : 'On'
    : 'Off'

  const handleToggle = useCallback(() => {
    callService('light', isOn ? 'turn_off' : 'turn_on', {}, entityId)
  }, [callService, isOn, entityId])

  const handleLongPress = useCallback(() => {
    setLocalBrightness(brightnessToPercent(attrs.brightness) || 100)
    setOpen(true)
  }, [attrs.brightness])

  const handleBrightnessChange = useCallback(
    (val: number[]) => {
      const pct = val[0]
      setLocalBrightness(pct)
      setIsDragging(true)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        callService('light', 'turn_on', { brightness: percentToBrightness(pct) }, entityId)
        setIsDragging(false)
      }, 150)
    },
    [callService, entityId]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <BaseTile
          isActive={isOn}
          activeColor="amber"
          icon={<Lightbulb className="w-full h-full" fill={isOn ? 'currentColor' : 'none'} />}
          label={entityLabel(entityId, attrs.friendly_name)}
          sublabel={sublabel}
          onClick={handleToggle}
          onLongPress={handleLongPress}
        />
      </PopoverAnchor>
      <PopoverContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ios-label">
              {entityLabel(entityId, attrs.friendly_name)}
            </span>
            <span className="text-sm text-ios-amber font-medium">{brightness}%</span>
          </div>
          <Slider
            min={1}
            max={100}
            step={1}
            value={[brightness]}
            onValueChange={handleBrightnessChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
