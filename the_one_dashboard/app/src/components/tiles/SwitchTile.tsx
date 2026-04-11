import { useCallback } from 'react'
import { ToggleRight, ToggleLeft } from 'lucide-react'
import { BaseTile } from './BaseTile'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel, getDomain, relativeTime } from '@/lib/utils'
import { getIconByName } from '@/lib/icons'

interface SwitchTileProps {
  entityId: string
}

export function SwitchTile({ entityId }: SwitchTileProps) {
  const entity = useEntity(entityId)
  const { callService, entityIcons } = useHA()

  if (!entity) return null

  const isOn = entity.state === 'on'
  const domain = getDomain(entityId)
  const attrs = entity.attributes
  const label = entityLabel(entityId, attrs.friendly_name)

  const CustomIcon = entityIcons[entityId] ? getIconByName(entityIcons[entityId]) : null

  const handleToggle = useCallback(() => {
    const svc = isOn ? 'turn_off' : 'turn_on'
    callService(domain, svc, {}, entityId)
  }, [callService, domain, isOn, entityId])

  const icon = CustomIcon
    ? <CustomIcon className="w-full h-full" />
    : isOn
      ? <ToggleRight className="w-full h-full" />
      : <ToggleLeft className="w-full h-full" />

  const when = relativeTime(entity.last_changed)
  const sublabel = `${isOn ? 'On' : 'Off'}${when ? ' · ' + when : ''}`

  return (
    <BaseTile
      isActive={isOn}
      activeColor="blue"
      icon={icon}
      label={label}
      sublabel={sublabel}
      onClick={handleToggle}
    />
  )
}
