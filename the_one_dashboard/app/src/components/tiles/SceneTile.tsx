import { Clapperboard } from 'lucide-react'
import { BaseTile } from './BaseTile'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel } from '@/lib/utils'
import { resolveEntityIcon } from '@/lib/icons'
import { useState } from 'react'

interface SceneTileProps {
  entityId: string
}

export function SceneTile({ entityId }: SceneTileProps) {
  const entity = useEntity(entityId)
  const { callService, entityIcons, entityLabels } = useHA()
  const [activating, setActivating] = useState(false)

  if (!entity) return null

  const attrs = entity.attributes
  const label = entityLabel(entityId, attrs.friendly_name, entityLabels)
  const CustomIcon = resolveEntityIcon(entityIcons, entityId)

  const handleActivate = async () => {
    setActivating(true)
    await callService('scene', 'turn_on', {}, entityId)
    setTimeout(() => setActivating(false), 1200)
  }

  const icon = CustomIcon
    ? <CustomIcon className="w-full h-full" />
    : <Clapperboard className="w-full h-full" />

  return (
    <BaseTile
      isActive={activating}
      activeColor="purple"
      icon={icon}
      label={label}
      sublabel={activating ? 'Activating…' : 'Scene'}
      onClick={handleActivate}
    />
  )
}
