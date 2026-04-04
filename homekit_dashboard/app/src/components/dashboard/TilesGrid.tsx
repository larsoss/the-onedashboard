import type { HassEntity } from '@/types/ha-types'
import { getDomain } from '@/lib/utils'
import { LightTile } from '@/components/tiles/LightTile'
import { SwitchTile } from '@/components/tiles/SwitchTile'
import { ThermostatTile } from '@/components/tiles/ThermostatTile'
import { LockTile } from '@/components/tiles/LockTile'
import { CoverTile } from '@/components/tiles/CoverTile'
import { SensorTile } from '@/components/tiles/SensorTile'
import { BaseTile } from '@/components/tiles/BaseTile'
import { Activity } from 'lucide-react'

// Domains that are surfaced in the tile grid
const SUPPORTED_DOMAINS = new Set([
  'light',
  'switch',
  'input_boolean',
  'climate',
  'lock',
  'cover',
  'sensor',
  'binary_sensor',
])

function Tile({ entity }: { entity: HassEntity }) {
  const domain = getDomain(entity.entity_id)
  switch (domain) {
    case 'light':
      return <LightTile entityId={entity.entity_id} />
    case 'switch':
    case 'input_boolean':
      return <SwitchTile entityId={entity.entity_id} />
    case 'climate':
      return <ThermostatTile entityId={entity.entity_id} />
    case 'lock':
      return <LockTile entityId={entity.entity_id} />
    case 'cover':
      return <CoverTile entityId={entity.entity_id} />
    case 'sensor':
    case 'binary_sensor':
      return <SensorTile entityId={entity.entity_id} />
    default:
      return (
        <BaseTile
          icon={<Activity className="w-full h-full" />}
          label={entity.entity_id}
          sublabel={entity.state}
        />
      )
  }
}

interface TilesGridProps {
  entities: HassEntity[]
}

export function TilesGrid({ entities }: TilesGridProps) {
  const visible = entities.filter((e) => SUPPORTED_DOMAINS.has(getDomain(e.entity_id)))

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-ios-secondary">
        <Activity className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-base font-medium">No entities here</p>
        <p className="text-sm mt-1 opacity-70">Try a different tab or add entities in Home Assistant</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
      {visible.map((entity) => (
        <Tile key={entity.entity_id} entity={entity} />
      ))}
    </div>
  )
}
