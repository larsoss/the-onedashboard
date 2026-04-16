import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning,
  CloudDrizzle, Wind, Cloudy, CloudFog,
} from 'lucide-react'
import { BaseTile } from './BaseTile'
import { useEntity } from '@/hooks/useEntities'
import { useHA } from '@/hooks/useHAClient'
import { entityLabel } from '@/lib/utils'
import type { WeatherAttributes, WeatherForecast } from '@/types/ha-types'
import { cn } from '@/lib/utils'

const CONDITION_ICONS: Record<string, React.FC<{ className?: string }>> = {
  sunny:                Sun,
  clear:                Sun,
  'clear-night':        Sun,
  cloudy:               Cloudy,
  'partly-cloudy-day':  Cloud,
  'partly-cloudy-night':Cloud,
  rainy:                CloudRain,
  pouring:              CloudRain,
  snowy:                CloudSnow,
  'snowy-rainy':        CloudSnow,
  sleet:                CloudDrizzle,
  fog:                  CloudFog,
  hail:                 CloudDrizzle,
  lightning:            CloudLightning,
  'lightning-rainy':    CloudLightning,
  windy:                Wind,
  'windy-variant':      Wind,
  exceptional:          Sun,
}

function getWeatherIcon(condition: string): React.FC<{ className?: string }> {
  return CONDITION_ICONS[condition.toLowerCase()] ?? Cloud
}

function formatDay(dt: string): string {
  const d = new Date(dt)
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

interface WeatherTileProps {
  entityId: string
}

export function WeatherTile({ entityId }: WeatherTileProps) {
  const entity = useEntity(entityId)
  const { entityLabels } = useHA()

  if (!entity) return null

  const attrs = entity.attributes as WeatherAttributes
  const condition = entity.state
  const label = entityLabel(entityId, attrs.friendly_name, entityLabels)
  const WeatherIcon = getWeatherIcon(condition)
  const tempUnit = attrs.temperature_unit ?? '°C'
  const temp = typeof attrs.temperature === 'number' ? `${Math.round(attrs.temperature)}${tempUnit}` : '--'

  // Up to 3-day forecast (skip today's entry which is index 0)
  const forecast: WeatherForecast[] = (attrs.forecast ?? []).slice(1, 4)

  return (
    <BaseTile
      isActive
      activeColor="blue"
      icon={<WeatherIcon className="w-full h-full" />}
      label={label}
      sublabel={`${temp} · ${condition}`}
    >
      {forecast.length > 0 && (
        <div className="flex gap-1 justify-between mt-1">
          {forecast.map((day, i) => {
            const DayIcon = getWeatherIcon(day.condition)
            const dayTemp = typeof day.temperature === 'number'
              ? `${Math.round(day.temperature)}°`
              : '--'
            return (
              <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                <span className="text-[9px] text-ios-secondary leading-none">
                  {formatDay(day.datetime)}
                </span>
                <DayIcon className={cn('w-3 h-3 text-ios-secondary')} />
                <span className="text-[9px] text-ios-label font-medium leading-none">
                  {dayTemp}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </BaseTile>
  )
}
