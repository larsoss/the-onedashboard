import {
  Thermometer,
  Droplets,
  Activity,
  Zap,
  Eye,
  DoorOpen,
  Wind,
  Sun,
  Gauge,
} from 'lucide-react'
import { BaseTile } from './BaseTile'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel } from '@/lib/utils'
import { resolveEntityIcon } from '@/lib/icons'
import type { SensorAttributes } from '@/types/ha-types'

function getDefaultIcon(deviceClass: string | undefined) {
  switch (deviceClass) {
    case 'temperature':    return <Thermometer className="w-full h-full" />
    case 'humidity':       return <Droplets className="w-full h-full" />
    case 'power':
    case 'energy':
    case 'current':
    case 'voltage':        return <Zap className="w-full h-full" />
    case 'motion':
    case 'occupancy':      return <Activity className="w-full h-full" />
    case 'door':
    case 'window':
    case 'garage_door':    return <DoorOpen className="w-full h-full" />
    case 'illuminance':    return <Sun className="w-full h-full" />
    case 'wind_speed':     return <Wind className="w-full h-full" />
    case 'pressure':       return <Gauge className="w-full h-full" />
    default:               return <Eye className="w-full h-full" />
  }
}

interface SensorTileProps {
  entityId: string
}

export function SensorTile({ entityId }: SensorTileProps) {
  const entity = useEntity(entityId)
  const { entityIcons, entityLabels } = useHA()

  if (!entity) return null

  const attrs = entity.attributes as SensorAttributes
  const deviceClass = attrs.device_class
  const unit = attrs.unit_of_measurement ?? ''
  const label = entityLabel(entityId, attrs.friendly_name, entityLabels)

  const isBinary = entityId.startsWith('binary_sensor.')
  const isActive = isBinary && entity.state === 'on'

  const numericVal = parseFloat(entity.state)
  const isNumeric = !isBinary && !isNaN(numericVal)

  const valueDisplay = isBinary
    ? entity.state === 'on' ? 'On' : 'Off'
    : `${entity.state}${unit ? '\u202f' + unit : ''}`

  const CustomIconComp = resolveEntityIcon(entityIcons, entityId)
  const icon = CustomIconComp
    ? <CustomIconComp className="w-full h-full" />
    : getDefaultIcon(deviceClass)

  return (
    <BaseTile
      isActive={isActive}
      activeColor={isBinary ? 'blue' : 'none'}
      icon={icon}
      label={label}
    >
      {/* Large value display — much easier to read at a glance */}
      <div className="flex-1 flex items-center">
        {isNumeric ? (
          <div className="flex items-baseline gap-0.5 leading-none">
            <span className="text-xl font-bold text-ios-label tabular-nums">
              {Number.isInteger(numericVal) ? numericVal : numericVal.toFixed(1)}
            </span>
            {unit && (
              <span className="text-xs text-ios-secondary font-medium">{unit}</span>
            )}
          </div>
        ) : (
          <span className="text-sm font-semibold text-ios-label truncate">{valueDisplay}</span>
        )}
      </div>
    </BaseTile>
  )
}
