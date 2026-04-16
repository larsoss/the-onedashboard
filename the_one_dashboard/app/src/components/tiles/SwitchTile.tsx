import { useState, useEffect } from 'react'
import { ToggleRight, ToggleLeft } from 'lucide-react'
import { BaseTile } from './BaseTile'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel, getDomain, relativeTime } from '@/lib/utils'
import { resolveEntityIcon } from '@/lib/icons'

interface SwitchTileProps {
  entityId: string
}

export function SwitchTile({ entityId }: SwitchTileProps) {
  const entity = useEntity(entityId)
  const { callService, entityIcons, entityLabels } = useHA()

  // Optimistic on/off — flips immediately on tap, cleared when HA confirms
  const [optimisticOn, setOptimisticOn] = useState<boolean | null>(null)

  useEffect(() => {
    setOptimisticOn(null)
  }, [entity?.state])

  if (!entity) return null

  const entityOn = entity.state === 'on'
  const isOn = optimisticOn !== null ? optimisticOn : entityOn
  const domain = getDomain(entityId)
  const attrs = entity.attributes
  const label = entityLabel(entityId, attrs.friendly_name, entityLabels)

  const CustomIcon = resolveEntityIcon(entityIcons, entityId)

  const handleToggle = () => {
    const next = !isOn
    setOptimisticOn(next)
    callService(domain, next ? 'turn_on' : 'turn_off', {}, entityId)
  }

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
