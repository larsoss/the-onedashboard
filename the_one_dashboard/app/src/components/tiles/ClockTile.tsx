import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { BaseTile } from './BaseTile'

function useClock() {
  const fmt = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 10_000)
    return () => clearInterval(id)
  }, [])
  return time
}

export function ClockTile({ title }: { title?: string }) {
  const time = useClock()
  const date = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <BaseTile
      isActive={false}
      icon={<Clock className="w-full h-full" />}
      label={title ?? 'Clock'}
      sublabel={date}
    >
      <p className="text-3xl font-bold text-ios-label tabular-nums leading-tight">{time}</p>
    </BaseTile>
  )
}
