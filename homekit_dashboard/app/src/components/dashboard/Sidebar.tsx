import { useState, useEffect, useMemo } from 'react'
import {
  X, Lightbulb, ToggleRight, DoorOpen,
  Bell, BellOff, Cloud,
} from 'lucide-react'
import { useHA } from '@/hooks/useHAClient'
import { getDomain, entityLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { WeatherAttributes } from '@/types/ha-types'

// Greeting based on hour
function greeting(name: string): string {
  const h = new Date().getHours()
  if (h < 5)  return `Goedenacht, ${name}`
  if (h < 12) return `Goedemorgen, ${name}`
  if (h < 18) return `Goedemiddag, ${name}`
  return `Goedenavond, ${name}`
}

function useClock() {
  const fmt = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const [t, setT] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 10_000)
    return () => clearInterval(id)
  }, [])
  return t
}

// Map weather condition to lucide icon color
const CONDITION_COLOR: Record<string, string> = {
  sunny: 'text-ios-amber', clear: 'text-ios-amber', 'clear-night': 'text-ios-blue',
  cloudy: 'text-ios-secondary', rainy: 'text-ios-blue', snowy: 'text-ios-teal',
  lightning: 'text-ios-amber', fog: 'text-ios-secondary',
}

interface SidebarProps {
  open: boolean
  onClose: () => void
  onNavigate?: (tab: string) => void
}

export function Sidebar({ open, onClose, onNavigate }: SidebarProps) {
  const { entities, haUsers, currentUserId, callService } = useHA()
  const time = useClock()

  const userName = useMemo(() => {
    if (!currentUserId) return 'there'
    const u = haUsers.find((u) => u.id === currentUserId)
    return u ? u.name.split(' ')[0] : 'there'
  }, [haUsers, currentUserId])

  const entityList = Object.values(entities)

  // Active device counts
  const lightsOn = useMemo(
    () => entityList.filter((e) => getDomain(e.entity_id) === 'light' && e.state === 'on'),
    [entityList]
  )
  const switchesOn = useMemo(
    () => entityList.filter((e) => ['switch', 'input_boolean'].includes(getDomain(e.entity_id)) && e.state === 'on'),
    [entityList]
  )
  const coversOpen = useMemo(
    () => entityList.filter((e) => getDomain(e.entity_id) === 'cover' && e.state === 'open'),
    [entityList]
  )

  // Weather entity (first found)
  const weatherEntity = useMemo(
    () => entityList.find((e) => getDomain(e.entity_id) === 'weather'),
    [entityList]
  )
  const weatherAttrs = weatherEntity?.attributes as WeatherAttributes | undefined

  // Persistent notifications
  const notifications = useMemo(
    () => entityList.filter((e) => getDomain(e.entity_id) === 'persistent_notification' && e.state !== 'dismissed'),
    [entityList]
  )

  const dismissNotification = (entityId: string) => {
    const notifId = entityId.replace('persistent_notification.', '')
    callService('persistent_notification', 'dismiss', { notification_id: notifId })
  }

  return (
    <>
      {/* Overlay backdrop (mobile) */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-40 w-72 flex flex-col',
          'bg-ios-card border-r border-white/10',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
          // On desktop ≥1024px, sidebar is persistent — layout pushes main content
          'lg:relative lg:translate-x-0 lg:flex-shrink-0',
          !open && 'lg:w-0 lg:overflow-hidden lg:border-none'
        )}
      >
        {/* Close button (mobile) */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 lg:hidden">
          <span className="text-xs font-semibold text-ios-secondary uppercase tracking-wider">Menu</span>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-ios-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5 pt-4">
          {/* Clock & Greeting */}
          <div className="space-y-0.5">
            <p className="text-4xl font-bold text-ios-label tabular-nums">{time}</p>
            <p className="text-sm text-ios-secondary">{greeting(userName)}</p>
            <p className="text-xs text-ios-secondary">
              {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Weather */}
          {weatherEntity && weatherAttrs && (
            <div className="bg-ios-card-2 rounded-2xl p-3 flex items-center gap-3">
              <Cloud className={cn('w-8 h-8 shrink-0', CONDITION_COLOR[weatherEntity.state] ?? 'text-ios-secondary')} />
              <div>
                <p className="text-sm font-semibold text-ios-label capitalize">{weatherEntity.state}</p>
                {typeof weatherAttrs.temperature === 'number' && (
                  <p className="text-xs text-ios-secondary">
                    {Math.round(weatherAttrs.temperature)}{weatherAttrs.temperature_unit ?? '°C'}
                    {typeof weatherAttrs.humidity === 'number' && ` · ${Math.round(weatherAttrs.humidity)}% vocht`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Active devices */}
          {(lightsOn.length > 0 || switchesOn.length > 0 || coversOpen.length > 0) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-ios-secondary uppercase tracking-wider">Actieve apparaten</p>
              {lightsOn.length > 0 && (
                <button
                  onClick={() => onNavigate?.('home')}
                  className="w-full flex items-center gap-3 bg-ios-amber/10 rounded-2xl px-3 py-2.5 text-left hover:bg-ios-amber/20 transition-all"
                >
                  <Lightbulb className="w-4 h-4 text-ios-amber shrink-0" />
                  <span className="text-sm text-ios-label">
                    {lightsOn.length} {lightsOn.length === 1 ? 'lamp' : 'lampen'} aan
                  </span>
                </button>
              )}
              {switchesOn.length > 0 && (
                <button
                  onClick={() => onNavigate?.('home')}
                  className="w-full flex items-center gap-3 bg-ios-blue/10 rounded-2xl px-3 py-2.5 text-left hover:bg-ios-blue/20 transition-all"
                >
                  <ToggleRight className="w-4 h-4 text-ios-blue shrink-0" />
                  <span className="text-sm text-ios-label">
                    {switchesOn.length} {switchesOn.length === 1 ? 'schakelaar' : 'schakelaars'} aan
                  </span>
                </button>
              )}
              {coversOpen.length > 0 && (
                <button
                  onClick={() => onNavigate?.('home')}
                  className="w-full flex items-center gap-3 bg-ios-teal/10 rounded-2xl px-3 py-2.5 text-left hover:bg-ios-teal/20 transition-all"
                >
                  <DoorOpen className="w-4 h-4 text-ios-teal shrink-0" />
                  <span className="text-sm text-ios-label">
                    {coversOpen.length} {coversOpen.length === 1 ? 'screen' : 'screens'} open
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-ios-secondary uppercase tracking-wider">
                Meldingen ({notifications.length})
              </p>
              {notifications.map((n) => {
                const title = typeof n.attributes.title === 'string' ? n.attributes.title : entityLabel(n.entity_id)
                const message = typeof n.attributes.message === 'string' ? n.attributes.message : n.state
                return (
                  <div key={n.entity_id} className="bg-ios-card-2 rounded-2xl p-3 relative">
                    <button
                      onClick={() => dismissNotification(n.entity_id)}
                      className="absolute top-2.5 right-2.5 text-ios-secondary hover:text-ios-label"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-start gap-2 pr-5">
                      <Bell className="w-3.5 h-3.5 text-ios-amber mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-ios-label">{title}</p>
                        <p className="text-xs text-ios-secondary mt-0.5 line-clamp-3">{message}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {notifications.length === 0 && (
            <div className="flex items-center gap-2 text-ios-secondary">
              <BellOff className="w-4 h-4" />
              <span className="text-xs">Geen meldingen</span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
