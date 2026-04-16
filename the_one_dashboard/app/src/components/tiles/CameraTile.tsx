import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, X, Maximize2 } from 'lucide-react'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel } from '@/lib/utils'
import type { CameraAttributes } from '@/types/ha-types'
import { cn } from '@/lib/utils'
const REFRESH_INTERVAL_MS = 10_000

interface CameraTileProps {
  entityId: string
}

export function CameraTile({ entityId }: CameraTileProps) {
  const entity = useEntity(entityId)
  const { entityLabels } = useHA()
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshSnapshot = useCallback(() => {
    // Cache-bust with timestamp
    setSnapshotUrl(`/dashboard-api/camera/${encodeURIComponent(entityId)}/snapshot?t=${Date.now()}`)
  }, [entityId])

  useEffect(() => {
    refreshSnapshot()
    timerRef.current = setInterval(refreshSnapshot, REFRESH_INTERVAL_MS)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [refreshSnapshot])

  if (!entity) return null

  const attrs = entity.attributes as CameraAttributes
  const label = entityLabel(entityId, attrs.friendly_name, entityLabels)

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setFullscreen(true)}
        className={cn(
          'relative rounded-2xl overflow-hidden cursor-pointer select-none h-full',
          'transition-all duration-150 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ios-blue',
        )}
      >
        {snapshotUrl ? (
          <img
            src={snapshotUrl}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-ios-card-2 flex items-center justify-center">
            <Camera className="w-8 h-8 text-ios-secondary" />
          </div>
        )}
        {/* Label overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-end justify-between">
          <p className="text-xs font-semibold text-white truncate">{label}</p>
          <Maximize2 className="w-3.5 h-3.5 text-white/70 shrink-0" />
        </div>
      </div>

      {/* Full-screen modal with live stream */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold text-white">{label}</p>
            <button onClick={() => setFullscreen(false)}>
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {/* Try HLS stream first; fall back to refreshing snapshot */}
            <video
              key={entityId}
              src={`/dashboard-api/camera/${encodeURIComponent(entityId)}/stream`}
              autoPlay
              playsInline
              muted
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                // Fall back to snapshot img
                const target = e.currentTarget
                const parent = target.parentElement
                if (parent) {
                  target.remove()
                  const img = document.createElement('img')
                  img.src = snapshotUrl ?? ''
                  img.className = 'max-w-full max-h-full object-contain'
                  parent.appendChild(img)
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
