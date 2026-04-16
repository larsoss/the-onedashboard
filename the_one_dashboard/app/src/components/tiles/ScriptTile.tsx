import { Play, Loader2 } from 'lucide-react'
import { BaseTile } from './BaseTile'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel } from '@/lib/utils'
import { resolveEntityIcon } from '@/lib/icons'

interface ScriptTileProps {
  entityId: string
}

export function ScriptTile({ entityId }: ScriptTileProps) {
  const entity = useEntity(entityId)
  const { callService, entityIcons, entityLabels } = useHA()

  if (!entity) return null

  const isRunning = entity.state === 'on'
  const attrs = entity.attributes
  const label = entityLabel(entityId, attrs.friendly_name, entityLabels)
  const CustomIcon = resolveEntityIcon(entityIcons, entityId)

  const handleRun = () => {
    if (!isRunning) callService('script', 'turn_on', {}, entityId)
  }

  const icon = CustomIcon
    ? <CustomIcon className="w-full h-full" />
    : isRunning
      ? <Loader2 className="w-full h-full animate-spin" />
      : <Play className="w-full h-full" />

  return (
    <BaseTile
      isActive={isRunning}
      activeColor="teal"
      icon={icon}
      label={label}
      sublabel={isRunning ? 'Running…' : 'Script'}
      onClick={handleRun}
    />
  )
}
