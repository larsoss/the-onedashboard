import { Zap, ZapOff } from 'lucide-react'
import { BaseTile } from './BaseTile'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel } from '@/lib/utils'
import { getIconByName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

interface AutomationTileProps {
  entityId: string
}

export function AutomationTile({ entityId }: AutomationTileProps) {
  const entity = useEntity(entityId)
  const { callService, entityIcons } = useHA()

  if (!entity) return null

  const isEnabled = entity.state === 'on'
  const attrs = entity.attributes
  const label = entityLabel(entityId, attrs.friendly_name)
  const CustomIcon = entityIcons[entityId] ? getIconByName(entityIcons[entityId]) : null

  const handleToggle = () => {
    callService('automation', isEnabled ? 'turn_off' : 'turn_on', {}, entityId)
  }

  const handleTrigger = (e: React.MouseEvent) => {
    e.stopPropagation()
    callService('automation', 'trigger', { skip_condition: true }, entityId)
  }

  const icon = CustomIcon
    ? <CustomIcon className="w-full h-full" />
    : isEnabled
      ? <Zap className="w-full h-full" />
      : <ZapOff className="w-full h-full" />

  return (
    <BaseTile
      isActive={isEnabled}
      activeColor="amber"
      icon={icon}
      label={label}
      sublabel={isEnabled ? t('enabled') : t('disabled')}
      onClick={handleToggle}
    >
      {/* Trigger button — runs automation immediately */}
      <button
        data-no-tile-click
        onClick={handleTrigger}
        className={cn(
          'self-end mt-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all',
          'pointer-events-auto',
          isEnabled
            ? 'bg-ios-amber/20 text-ios-amber hover:bg-ios-amber/30'
            : 'bg-white/10 text-ios-secondary hover:bg-white/20'
        )}
      >
        {t('run')}
      </button>
    </BaseTile>
  )
}
