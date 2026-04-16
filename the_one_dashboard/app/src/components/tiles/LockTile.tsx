import { useState, useCallback, useEffect } from 'react'
import { Lock, LockOpen } from 'lucide-react'
import { BaseTile } from './BaseTile'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel } from '@/lib/utils'
import { resolveEntityIcon } from '@/lib/icons'
import type { LockAttributes } from '@/types/ha-types'

interface LockTileProps {
  entityId: string
}

export function LockTile({ entityId }: LockTileProps) {
  const entity = useEntity(entityId)
  const { callService, entityIcons, entityLabels } = useHA()
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Optimistic locked state — changes immediately, cleared when HA confirms
  const [optimisticLocked, setOptimisticLocked] = useState<boolean | null>(null)

  useEffect(() => {
    setOptimisticLocked(null)
  }, [entity?.state])

  const entityLocked = entity?.state === 'locked'
  const isLocked = optimisticLocked !== null ? optimisticLocked : entityLocked

  const handleToggle = useCallback(() => {
    if (isLocked) {
      // Unlock requires confirmation
      setConfirmOpen(true)
    } else {
      // Lock immediately — show as locked right away
      setOptimisticLocked(true)
      callService('lock', 'lock', {}, entityId)
    }
  }, [callService, isLocked, entityId])

  const confirmUnlock = useCallback(() => {
    setOptimisticLocked(false)
    callService('lock', 'unlock', {}, entityId)
    setConfirmOpen(false)
  }, [callService, entityId])

  if (!entity) return null

  const attrs = entity.attributes as LockAttributes
  const label = entityLabel(entityId, attrs.friendly_name, entityLabels)
  const CustomIcon = resolveEntityIcon(entityIcons, entityId)

  const icon = CustomIcon
    ? <CustomIcon className="w-full h-full" />
    : isLocked
      ? <Lock className="w-full h-full" />
      : <LockOpen className="w-full h-full" />

  return (
    <>
      <BaseTile
        isActive={true}
        activeColor={isLocked ? 'red' : 'green'}
        icon={icon}
        label={label}
        sublabel={isLocked ? 'Locked' : 'Unlocked'}
        onClick={handleToggle}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle>Unlock {label}?</DialogTitle>
          <p className="mt-2 text-sm text-ios-secondary">
            Are you sure you want to unlock this?
          </p>
          <div className="mt-6 flex gap-3">
            <DialogClose asChild>
              <button className="flex-1 py-3 rounded-2xl bg-ios-card-2 text-ios-label text-sm font-medium hover:bg-ios-separator transition-colors">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={confirmUnlock}
              className="flex-1 py-3 rounded-2xl bg-ios-red/20 text-ios-red text-sm font-semibold hover:bg-ios-red/30 transition-colors"
            >
              Unlock
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
