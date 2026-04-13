import { useState, useCallback, useRef } from 'react'
import { PanelTop, PanelBottom } from 'lucide-react'
import { BaseTile } from './BaseTile'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel } from '@/lib/utils'
import { resolveEntityIcon } from '@/lib/icons'
import type { CoverAttributes } from '@/types/ha-types'

interface CoverTileProps {
  entityId: string
}

export function CoverTile({ entityId }: CoverTileProps) {
  const entity = useEntity(entityId)
  const { callService, entityIcons } = useHA()
  const [open, setOpen] = useState(false)
  const [localPosition, setLocalPosition] = useState(100)
  const [isDragging, setIsDragging] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!entity) return null

  const attrs = entity.attributes as CoverAttributes
  const isOpen = entity.state === 'open' || entity.state === 'opening'
  const position = isDragging ? localPosition : (attrs.current_position ?? (isOpen ? 100 : 0))

  const label = entityLabel(entityId, attrs.friendly_name)
  const sublabel = attrs.current_position !== undefined
    ? `${attrs.current_position}% open`
    : isOpen ? 'Open' : 'Closed'

  const CustomIcon = resolveEntityIcon(entityIcons, entityId)

  const icon = CustomIcon
    ? <CustomIcon className="w-full h-full" />
    : isOpen
      ? <PanelTop className="w-full h-full" />
      : <PanelBottom className="w-full h-full" />

  const handleToggle = useCallback(() => {
    if (isOpen) {
      callService('cover', 'close_cover', {}, entityId)
    } else {
      callService('cover', 'open_cover', {}, entityId)
    }
  }, [callService, isOpen, entityId])

  const handleLongPress = useCallback(() => {
    setLocalPosition(attrs.current_position ?? (isOpen ? 100 : 0))
    setOpen(true)
  }, [attrs.current_position, isOpen])

  const handlePositionChange = useCallback(
    (val: number[]) => {
      const pos = val[0]
      setLocalPosition(pos)
      setIsDragging(true)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        callService('cover', 'set_cover_position', { position: pos }, entityId)
        setIsDragging(false)
      }, 150)
    },
    [callService, entityId]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <BaseTile
          isActive={isOpen}
          activeColor="teal"
          icon={icon}
          label={label}
          sublabel={sublabel}
          onClick={handleToggle}
          onLongPress={handleLongPress}
        />
      </PopoverAnchor>
      <PopoverContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ios-label">{label}</span>
            <span className="text-sm text-ios-teal font-medium">{position}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[position]}
            onValueChange={handlePositionChange}
            className="[&_.bg-ios-amber]:bg-ios-teal"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { callService('cover', 'open_cover', {}, entityId); setOpen(false) }}
              className="flex-1 py-2 rounded-xl bg-ios-teal/20 text-ios-teal text-xs font-medium"
            >
              Open
            </button>
            <button
              onClick={() => { callService('cover', 'stop_cover', {}, entityId); setOpen(false) }}
              className="flex-1 py-2 rounded-xl bg-ios-card-2 text-ios-secondary text-xs font-medium"
            >
              Stop
            </button>
            <button
              onClick={() => { callService('cover', 'close_cover', {}, entityId); setOpen(false) }}
              className="flex-1 py-2 rounded-xl bg-ios-card-2 text-ios-secondary text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
