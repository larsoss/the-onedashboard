import { useCallback } from 'react'
import { ToggleRight, ToggleLeft } from 'lucide-react'
import { BaseTile } from './BaseTile'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel, getDomain } from '@/lib/utils'

interface SwitchTileProps {
  entityId: string
}

export function SwitchTile({ entityId }: SwitchTileProps) {
  const entity = useEntity(entityId)
  const { callService } = useHA()

  if (!entity) return null

  const isOn = entity.state === 'on'
  const domain = getDomain(entityId)
  const attrs = entity.attributes
  const label = entityLabel(entityId, attrs.friendly_name)

  const handleToggle = useCallback(() => {
    const svc = isOn ? 'turn_off' : 'turn_on'
    callService(domain, svc, {}, entityId)
  }, [callService, domain, isOn, entityId])

  return (
    <BaseTile
      isActive={isOn}
      activeColor="blue"
      icon={isOn
        ? <ToggleRight className="w-full h-full" />
        : <ToggleLeft className="w-full h-full" />
      }
      label={label}
      sublabel={isOn ? 'On' : 'Off'}
      onClick={handleToggle}
    />
  )
}
