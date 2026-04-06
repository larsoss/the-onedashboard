import React, { useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useHA } from '@/hooks/useHAClient'
import { TILE_ASPECT, ICON_SIZE_CLASS } from '@/lib/theme-storage'

export type ActiveColor = 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'teal' | 'none'

const ACTIVE_ICON: Record<ActiveColor, string> = {
  amber:  'text-ios-amber',
  blue:   'text-ios-blue',
  green:  'text-ios-green',
  red:    'text-ios-red',
  purple: 'text-ios-purple',
  teal:   'text-ios-teal',
  none:   'text-ios-secondary',
}

// RGBA rgb values for glass tints
const GLASS_TINT_RGB: Record<ActiveColor, string> = {
  amber:  '255,159,10',
  blue:   '10,132,255',
  green:  '48,209,88',
  red:    '255,69,58',
  teal:   '90,200,250',
  purple: '191,90,242',
  none:   '255,255,255',
}

interface BaseTileProps {
  isActive?: boolean
  activeColor?: ActiveColor
  /** Override the computed tint RGB (e.g. from light color). Format: "R,G,B" */
  customTintRgb?: string
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
  customTintRgb,
  icon,
  label,
  sublabel,
  onClick,
  onLongPress,
  className,
  children,
}: BaseTileProps) {
  const { theme } = useHA()
  const isGlass = theme.tileStyle === 'glass'
  const opacity = theme.tileOpacity / 100

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
    if (!didLongPress.current) onClick?.()
    didLongPress.current = false
  }, [onClick])

  // Effective tint: use customTintRgb if provided, otherwise domain color
  const tintRgb = customTintRgb ?? GLASS_TINT_RGB[activeColor]

  // Compute background via inline style so opacity is fully dynamic
  const bgStyle: React.CSSProperties = isGlass
    ? isActive
      ? {
          background: `rgba(${tintRgb},${(activeColor === 'none' && !customTintRgb ? 0.12 : 0.22) * opacity})`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid rgba(255,255,255,${0.18 * opacity})`,
        }
      : {
          background: `rgba(255,255,255,${0.06 * opacity})`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid rgba(255,255,255,${0.10 * opacity})`,
        }
    : isActive
      ? { background: `rgba(${tintRgb},${0.22 * opacity})` }
      : { background: `rgba(44,44,46,${opacity})` }

  const colorKey = isActive ? activeColor : 'none'

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
      style={bgStyle}
      className={cn(
        'relative rounded-2xl p-3 sm:p-4 flex flex-col justify-between',
        'cursor-pointer select-none transition-all duration-150',
        'active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ios-blue',
        TILE_ASPECT[theme.tileShape],
        className
      )}
    >
      {/* Top row: icon + active indicator */}
      <div className="flex items-start justify-between">
        <div className={cn(ICON_SIZE_CLASS[theme.iconSize], isActive ? ACTIVE_ICON[colorKey] : 'text-ios-secondary')}>
          {icon}
        </div>
        {isActive && (
          <span
            className={cn(
              'w-2 h-2 rounded-full mt-1 shrink-0',
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

      {children}

      {/* Bottom: label */}
      <div>
        <p className={cn(
          'font-semibold leading-tight truncate',
          theme.iconSize === 'small' ? 'text-xs' : 'text-sm',
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
