import { useState, useEffect, useMemo } from 'react'
import { Settings, Pencil, Check, Lightbulb, ToggleRight, Thermometer, Lock, PanelLeft, House } from 'lucide-react'
import { useHA } from '@/hooks/useHAClient'
import { getDomain } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ConnectionStatus } from '@/types/ha-types'

function StatusDot({ status }: { status: ConnectionStatus }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          status === 'connected'    ? 'bg-ios-green' : '',
          (status === 'connecting' || status === 'authenticating') ? 'bg-yellow-400 animate-pulse' : '',
          status === 'error'        ? 'bg-ios-red' : '',
          status === 'disconnected' ? 'bg-ios-secondary' : '',
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
    const id = setInterval(() => setTime(formatTime(new Date())), 30_000)
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

interface StatusChip {
  count: number
  label: string
  icon: React.ReactNode
  colorClass: string
}

interface HeaderProps {
  onSettingsClick: () => void
  onSidebarToggle?: () => void
}

export function Header({ onSettingsClick, onSidebarToggle }: HeaderProps) {
  const { status, locationName, entities, isEditMode, toggleEditMode } = useHA()
  const time = useTime()

  const statusChips = useMemo<StatusChip[]>(() => {
    const chips: StatusChip[] = []
    const vals = Object.values(entities)

    const lights = vals.filter((e) => getDomain(e.entity_id) === 'light' && e.state === 'on').length
    if (lights > 0) chips.push({
      count: lights, label: lights === 1 ? 'light' : 'lights',
      icon: <Lightbulb className="w-3 h-3" />, colorClass: 'bg-ios-amber/20 text-ios-amber',
    })

    const switches = vals.filter((e) => ['switch', 'input_boolean'].includes(getDomain(e.entity_id)) && e.state === 'on').length
    if (switches > 0) chips.push({
      count: switches, label: switches === 1 ? 'switch' : 'switches',
      icon: <ToggleRight className="w-3 h-3" />, colorClass: 'bg-ios-blue/20 text-ios-blue',
    })

    const climate = vals.filter((e) => getDomain(e.entity_id) === 'climate' && e.state !== 'off').length
    if (climate > 0) chips.push({
      count: climate, label: climate === 1 ? 'climate' : 'climates',
      icon: <Thermometer className="w-3 h-3" />, colorClass: 'bg-ios-purple/20 text-ios-purple',
    })

    const locked = vals.filter((e) => getDomain(e.entity_id) === 'lock' && e.state === 'locked').length
    if (locked > 0) chips.push({
      count: locked, label: locked === 1 ? 'lock' : 'locks',
      icon: <Lock className="w-3 h-3" />, colorClass: 'bg-ios-red/20 text-ios-red',
    })

    return chips
  }, [entities])

  return (
    <header className="px-4 pt-4 pb-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ios-label truncate">{locationName}</h1>
          <p className="text-sm text-ios-secondary mt-0.5">{formatDate(new Date())}</p>
        </div>
        <div className="flex items-center gap-2 pt-1 shrink-0">
          {/* Back to HA main menu — navigates parent frame to HA home */}
          <button
            onClick={() => {
              try { window.parent.location.href = '/' } catch { window.location.href = '/' }
            }}
            className="p-2 rounded-full bg-ios-card text-ios-secondary hover:text-ios-label active:scale-95 transition-all"
            aria-label="Terug naar Home Assistant"
            title="Terug naar Home Assistant"
          >
            <House className="w-4 h-4" />
          </button>
          {onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="p-2 rounded-full bg-ios-card text-ios-secondary hover:text-ios-label active:scale-95 transition-all"
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          <StatusDot status={status} />
          <span className="text-base font-semibold text-ios-label tabular-nums">{time}</span>
          <button
            onClick={toggleEditMode}
            className={cn(
              'p-2 rounded-full active:scale-95 transition-all',
              isEditMode
                ? 'bg-ios-blue text-white'
                : 'bg-ios-card text-ios-secondary hover:text-ios-label'
            )}
            aria-label={isEditMode ? 'Done editing' : 'Edit tiles'}
          >
            {isEditMode ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-full bg-ios-card text-ios-secondary hover:text-ios-label active:scale-95 transition-all"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status chips */}
      {statusChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {statusChips.map((chip) => (
            <div
              key={chip.label}
              className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', chip.colorClass)}
            >
              {chip.icon}
              <span>{chip.count} {chip.label}</span>
            </div>
          ))}
        </div>
      )}
    </header>
  )
}
