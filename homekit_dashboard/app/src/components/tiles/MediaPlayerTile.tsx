import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music } from 'lucide-react'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel } from '@/lib/utils'
import type { MediaPlayerAttributes } from '@/types/ha-types'
import { cn } from '@/lib/utils'
import { useHA as useHATheme } from '@/hooks/useHAClient'
import { TILE_ASPECT } from '@/lib/theme-storage'

interface MediaPlayerTileProps {
  entityId: string
}

export function MediaPlayerTile({ entityId }: MediaPlayerTileProps) {
  const entity = useEntity(entityId)
  const { callService } = useHA()
  const { theme } = useHATheme()

  if (!entity) return null

  const attrs = entity.attributes as MediaPlayerAttributes
  const isPlaying = entity.state === 'playing'
  const label = entityLabel(entityId, attrs.friendly_name)
  const title = attrs.media_title ?? label
  const artist = attrs.media_artist ?? entity.state
  const volume = typeof attrs.volume_level === 'number' ? attrs.volume_level : 1
  const isMuted = attrs.is_volume_muted ?? false
  // Use proxied entity picture if available
  const artUrl = attrs.entity_picture
    ? `/ha-api${attrs.entity_picture}`
    : null

  const call = (service: string, data: Record<string, unknown> = {}) =>
    callService('media_player', service, data, entityId)

  return (
    <div
      role="button"
      tabIndex={0}
      style={artUrl ? {} : undefined}
      className={cn(
        'relative rounded-2xl overflow-hidden flex flex-col justify-between p-3 sm:p-4',
        'cursor-pointer select-none transition-all duration-150 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ios-blue',
        TILE_ASPECT[theme.tileShape],
      )}
    >
      {/* Album art background */}
      {artUrl && (
        <>
          <img src={artUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        </>
      )}
      {!artUrl && (
        <div className="absolute inset-0 bg-ios-card-2" />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Top: icon + mute */}
        <div className="flex items-start justify-between">
          <Music className="w-5 h-5 text-ios-secondary" />
          <button
            onClick={(e) => { e.stopPropagation(); call('volume_mute', { is_volume_muted: !isMuted }) }}
            className="text-ios-secondary hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Middle: track info */}
        <div className="my-1">
          <p className="text-sm font-semibold text-white truncate leading-tight">{title}</p>
          <p className="text-xs text-white/70 truncate">{artist}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); call('media_previous_track') }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); call(isPlaying ? 'media_pause' : 'media_play') }}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); call('media_next_track') }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          {/* Volume bar */}
          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden ml-1">
            <div
              className="h-full bg-white/70 rounded-full transition-all"
              style={{ width: `${Math.round(volume * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
