import { useState, useEffect } from 'react'
import { useHA } from '@/hooks/useHAClient'
import { cn } from '@/lib/utils'
import type { ConnectionStatus } from '@/types/ha-types'

function StatusDot({ status }: { status: ConnectionStatus }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          status === 'connected'      && 'bg-ios-green',
          status === 'connecting' || status === 'authenticating'
                                      ? 'bg-yellow-400 animate-pulse' : '',
          status === 'error'          && 'bg-ios-red',
          status === 'disconnected'   && 'bg-ios-secondary',
        )}
      />
      {status !== 'connected' && (
        <span className="text-xs text-ios-secondary capitalize">
          {status === 'authenticating' ? 'Connecting…' : status}
        </span>
      )}
    </div>
  )
}

function useTime() {
  const [time, setTime] = useState(() => formatTime(new Date()))
  useEffect(() => {
    const tick = () => setTime(formatTime(new Date()))
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])
  return time
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d: Date): string {
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

export function Header() {
  const { status, locationName } = useHA()
  const time = useTime()

  return (
    <header className="px-4 pt-4 pb-2">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ios-label">{locationName}</h1>
          <p className="text-sm text-ios-secondary mt-0.5">{formatDate(new Date())}</p>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <StatusDot status={status} />
          <span className="text-base font-semibold text-ios-label tabular-nums">{time}</span>
        </div>
      </div>
    </header>
  )
}
