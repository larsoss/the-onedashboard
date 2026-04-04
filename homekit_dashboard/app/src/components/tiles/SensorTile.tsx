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
import { entityLabel } from '@/lib/utils'
import type { SensorAttributes } from '@/types/ha-types'

function getIcon(deviceClass: string | undefined) {
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

  if (!entity) return null

  const attrs = entity.attributes as SensorAttributes
  const deviceClass = attrs.device_class
  const unit = attrs.unit_of_measurement ?? ''
  const label = entityLabel(entityId, attrs.friendly_name)

  // For binary sensors show on/off state
  const isBinary = entityId.startsWith('binary_sensor.')
  const isActive = isBinary && entity.state === 'on'

  const valueDisplay = isBinary
    ? entity.state === 'on' ? 'On' : 'Off'
    : `${entity.state}${unit ? ' ' + unit : ''}`

  return (
    <BaseTile
      isActive={isActive}
      activeColor={isBinary ? 'blue' : 'none'}
      icon={getIcon(deviceClass)}
      label={label}
      sublabel={valueDisplay}
    />
  )
}
