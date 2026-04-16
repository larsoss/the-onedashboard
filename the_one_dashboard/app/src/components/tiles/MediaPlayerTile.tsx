import { useState, useEffect, useRef } from 'react'
import {
  Play, Pause, SkipForward, SkipBack,
  Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Music,
} from 'lucide-react'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel } from '@/lib/utils'
import type { MediaPlayerAttributes } from '@/types/ha-types'
import { cn } from '@/lib/utils'

interface MediaPlayerTileProps {
  entityId: string
}

/** Format seconds → m:ss */
function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MediaPlayerTile({ entityId }: MediaPlayerTileProps) {
  const entity = useEntity(entityId)
  const { callService, entityLabels } = useHA()

  // Real-time progress 0–1 interpolated from HA position + elapsed time
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const attrs = (entity?.attributes ?? {}) as MediaPlayerAttributes
  const isPlaying = entity?.state === 'playing'
  const duration = attrs.media_duration ?? 0
  const basePosition = attrs.media_position ?? 0
  const updatedAt = attrs.media_position_updated_at ?? null

  useEffect(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (!duration) { setProgress(0); return }

    const calc = () => {
      if (!isPlaying || !updatedAt) {
        setProgress(duration > 0 ? basePosition / duration : 0)
        return
      }
      const elapsed = (Date.now() - new Date(updatedAt).getTime()) / 1000
      const current = Math.min(basePosition + elapsed, duration)
      setProgress(current / duration)
    }

    calc()
    if (isPlaying && updatedAt) {
      intervalRef.current = setInterval(calc, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, basePosition, updatedAt, duration])

  if (!entity) return null

  const label = entityLabel(entityId, attrs.friendly_name, entityLabels)
  const title = attrs.media_title ?? label
  const artist = attrs.media_artist ?? ''
  const album = attrs.media_album_name ?? ''
  const isMuted = attrs.is_volume_muted ?? false
  const volume = typeof attrs.volume_level === 'number' ? attrs.volume_level : 1
  const shuffle = attrs.shuffle ?? false
  const repeat = attrs.repeat ?? 'off'    // 'off' | 'one' | 'all'
  const artUrl = attrs.entity_picture ? `/ha-api${attrs.entity_picture}` : null
  const currentSec = progress * duration
  const remaining = duration - currentSec

  const call = (service: string, data: Record<string, unknown> = {}) =>
    callService('media_player', service, data, entityId)

  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat

  return (
    <div className="relative rounded-2xl overflow-hidden h-full flex flex-col select-none">

      {/* ── Layer 1: blurred album art fills entire card ─────────────────── */}
      {artUrl ? (
        <img
          src={artUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-110"
          style={{ filter: 'blur(28px)', transform: 'scale(1.15)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
      )}

      {/* ── Layer 2: dark scrim for readability ──────────────────────────── */}
      <div className="absolute inset-0 bg-black/55" />

      {/* ── Layer 3: subtle grain texture overlay ────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '180px',
        }}
      />

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col flex-1 p-3 gap-2">

        {/* Top row: source label + volume */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-white/40 truncate max-w-[70%]">
            {attrs.source ?? 'Now Playing'}
          </span>
          <button
            data-no-tile-click
            onClick={(e) => { e.stopPropagation(); call('volume_mute', { is_volume_muted: !isMuted }) }}
            className="text-white/40 hover:text-white/80 transition-colors p-1"
          >
            {isMuted
              ? <VolumeX className="w-3.5 h-3.5" />
              : <Volume2 className="w-3.5 h-3.5" />
            }
          </button>
        </div>

        {/* Center: album art + track info */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2.5 min-h-0">
          {/* Album art — crisp, centered, with glow */}
          <div className="relative shrink-0">
            {artUrl ? (
              <img
                src={artUrl}
                alt={title}
                className={cn(
                  'rounded-xl object-cover shadow-2xl transition-all duration-500',
                  isPlaying ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-20 h-20 sm:w-24 sm:h-24 opacity-80'
                )}
              />
            ) : (
              <div
                className={cn(
                  'rounded-xl flex items-center justify-center bg-white/10 transition-all duration-500',
                  isPlaying ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-20 h-20 sm:w-24 sm:h-24 opacity-70'
                )}
              >
                <Music className="w-10 h-10 text-white/40" />
              </div>
            )}

            {/* Pulsing glow ring when playing */}
            {isPlaying && (
              <div className="absolute inset-0 rounded-xl ring-2 ring-white/20 animate-pulse" />
            )}
          </div>

          {/* Track title + artist */}
          <div className="text-center px-1 w-full">
            <p className="text-sm font-bold text-white truncate leading-tight">{title}</p>
            {artist && (
              <p className="text-xs text-white/60 truncate mt-0.5">{artist}</p>
            )}
            {album && !artist && (
              <p className="text-xs text-white/40 truncate mt-0.5">{album}</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {duration > 0 && (
          <div data-no-tile-click className="space-y-1">
            {/* Track */}
            <div className="relative h-1 rounded-full bg-white/15 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-none"
                style={{
                  width: `${progress * 100}%`,
                  background: 'linear-gradient(to right, #1DB954, #1ed760)',
                }}
              />
            </div>
            {/* Times */}
            <div className="flex justify-between">
              <span className="text-[10px] text-white/40 font-mono">{fmt(currentSec)}</span>
              <span className="text-[10px] text-white/40 font-mono">−{fmt(remaining)}</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div data-no-tile-click className="flex items-center justify-between px-1">
          {/* Shuffle */}
          <button
            onClick={(e) => { e.stopPropagation(); call('shuffle_set', { shuffle: !shuffle }) }}
            className={cn(
              'p-1.5 rounded-full transition-all',
              shuffle ? 'text-[#1DB954]' : 'text-white/35 hover:text-white/70'
            )}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); call('media_previous_track') }}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Play / Pause — main button */}
          <button
            onClick={(e) => { e.stopPropagation(); call(isPlaying ? 'media_pause' : 'media_play') }}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg',
              'bg-white hover:bg-white/90',
            )}
          >
            {isPlaying
              ? <Pause className="w-5 h-5 text-black fill-black" />
              : <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            }
          </button>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); call('media_next_track') }}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          {/* Repeat */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              const next = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off'
              call('repeat_set', { repeat: next })
            }}
            className={cn(
              'p-1.5 rounded-full transition-all',
              repeat !== 'off' ? 'text-[#1DB954]' : 'text-white/35 hover:text-white/70'
            )}
          >
            <RepeatIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Volume bar */}
        {!isMuted && (
          <div className="flex items-center gap-2 px-1">
            <Volume2 className="w-3 h-3 text-white/30 shrink-0" />
            <div className="flex-1 h-0.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/40 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(volume * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
