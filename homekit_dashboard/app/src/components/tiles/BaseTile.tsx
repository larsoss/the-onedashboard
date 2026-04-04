import React, { useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

export type ActiveColor = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'teal' | 'none'

const ACTIVE_BG: Record<ActiveColor, string> = {
  amber:  'bg-ios-amber/20',
  blue:   'bg-ios-blue/20',
  green:  'bg-ios-green/20',
  red:    'bg-ios-red/20',
  purple: 'bg-ios-purple/20',
  teal:   'bg-ios-teal/20',
  none:   '',
}

const ACTIVE_ICON: Record<ActiveColor, string> = {
  amber:  'text-ios-amber',
  blue:   'text-ios-blue',
  green:  'text-ios-green',
  red:    'text-ios-red',
  purple: 'text-ios-purple',
  teal:   'text-ios-teal',
  none:   'text-ios-secondary',
}

interface BaseTileProps {
  isActive?: boolean
  activeColor?: ActiveColor
  icon: React.ReactNode
  label: string
  sublabel?: string
  onClick?: () => void
  onLongPress?: () => void
  className?: string
  children?: React.ReactNode
}

export function BaseTile({
  isActive = false,
  activeColor = 'none',
  icon,
  label,
  sublabel,
  onClick,
  onLongPress,
  className,
  children,
}: BaseTileProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const startPress = useCallback(() => {
    didLongPress.current = false
    if (onLongPress) {
      timerRef.current = setTimeout(() => {
        didLongPress.current = true
        onLongPress()
      }, 500)
    }
  }, [onLongPress])

  const cancelPress = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const handleClick = useCallback(() => {
    if (!didLongPress.current) {
      onClick?.()
    }
    didLongPress.current = false
  }, [onClick])

  const colorClass = isActive ? activeColor : 'none'

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() }}
      className={cn(
        'relative aspect-square rounded-2xl p-4 flex flex-col justify-between',
        'cursor-pointer select-none transition-all duration-150',
        'active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ios-blue',
        isActive ? 'bg-ios-card-2' : 'bg-ios-card',
        isActive && ACTIVE_BG[activeColor],
        className
      )}
    >
      {/* Top row: icon + active indicator */}
      <div className="flex items-start justify-between">
        <div className={cn('w-8 h-8', isActive ? ACTIVE_ICON[colorClass] : 'text-ios-secondary')}>
          {icon}
        </div>
        {isActive && (
          <span
            className={cn(
              'w-2 h-2 rounded-full mt-1',
              activeColor === 'amber'  && 'bg-ios-amber',
              activeColor === 'blue'   && 'bg-ios-blue',
              activeColor === 'green'  && 'bg-ios-green',
              activeColor === 'red'    && 'bg-ios-red',
              activeColor === 'teal'   && 'bg-ios-teal',
              activeColor === 'purple' && 'bg-ios-purple',
            )}
          />
        )}
      </div>

      {/* Extra children (e.g. popover trigger overlays) */}
      {children}

      {/* Bottom row: label */}
      <div>
        <p className={cn(
          'text-sm font-semibold leading-tight truncate',
          isActive ? 'text-ios-label' : 'text-ios-secondary'
        )}>
          {label}
        </p>
        {sublabel && (
          <p className="text-xs text-ios-secondary mt-0.5 truncate">{sublabel}</p>
        )}
      </div>
    </div>
  )
}
