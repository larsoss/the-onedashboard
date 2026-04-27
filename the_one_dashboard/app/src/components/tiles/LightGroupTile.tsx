import { Lightbulb } from 'lucide-react'
import { BaseTile } from './BaseTile'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel, brightnessToPercent } from '@/lib/utils'
import type { LightAttributes } from '@/types/ha-types'

interface LightGroupTileProps {
  entityIds: string[]
  title?: string
}

export function LightGroupTile({ entityIds, title }: LightGroupTileProps) {
  const { entities, callService, entityLabels } = useHA()

  const lights = entityIds.map((id) => entities[id]).filter(Boolean)
  const onLights = lights.filter((e) => e.state === 'on')
  const onCount = onLights.length
  const isAnyOn = onCount > 0

  const avgBrightness = isAnyOn
    ? Math.round(
        onLights.reduce(
          (acc, e) => acc + brightnessToPercent((e.attributes as LightAttributes).brightness),
          0,
        ) / onCount,
      )
    : 0

  const toggleAll = () => {
    const service = isAnyOn ? 'turn_off' : 'turn_on'
    entityIds.forEach((id) => callService('light', service, {}, id))
  }

  const firstEntity = lights[0]
  const derivedLabel = title
    ?? (firstEntity
      ? entityLabel(entityIds[0], (firstEntity.attributes as LightAttributes).friendly_name, entityLabels)
      : 'Lights')

  const sublabel = isAnyOn
    ? `${onCount}/${lights.length} on · ${avgBrightness}%`
    : `${lights.length} light${lights.length !== 1 ? 's' : ''} off`

  return (
    <BaseTile
      isActive={isAnyOn}
      activeColor="amber"
      icon={
        <Lightbulb
          className="w-full h-full"
          fill={isAnyOn ? 'currentColor' : 'none'}
        />
      }
      label={derivedLabel}
      sublabel={sublabel}
      onClick={toggleAll}
    >
      {isAnyOn && (
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-ios-amber/85 transition-all duration-500"
            style={{ width: `${avgBrightness}%` }}
          />
        </div>
      )}
    </BaseTile>
  )
}
