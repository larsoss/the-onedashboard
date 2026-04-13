import {
  Lightbulb, Lamp, Sun, Flame, Thermometer, Droplets, Wind, Fan, Snowflake,
  Lock, LockOpen, ShieldCheck, DoorOpen, DoorClosed,
  Tv, Speaker, Monitor, Power, Zap, PlugZap,
  Car, Camera, Bell, BellOff,
  Home, Building2, Sofa, Bed,
  Gauge, Wifi, Coffee, Waves, AirVent, Heater, Blinds, Siren, Star, Plug,
  Sunrise, Sunset, Cloud, CloudRain,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface IconOption {
  name: string
  icon: LucideIcon
  label: string
}

export const ICON_OPTIONS: IconOption[] = [
  { name: 'Lightbulb',   icon: Lightbulb,   label: 'Bulb' },
  { name: 'Lamp',        icon: Lamp,         label: 'Lamp' },
  { name: 'Sun',         icon: Sun,          label: 'Sun' },
  { name: 'Sunrise',     icon: Sunrise,      label: 'Sunrise' },
  { name: 'Sunset',      icon: Sunset,       label: 'Sunset' },
  { name: 'Flame',       icon: Flame,        label: 'Flame' },
  { name: 'Heater',      icon: Heater,       label: 'Heater' },
  { name: 'Thermometer', icon: Thermometer,  label: 'Temp' },
  { name: 'Snowflake',   icon: Snowflake,    label: 'Cold' },
  { name: 'AirVent',     icon: AirVent,      label: 'Vent' },
  { name: 'Fan',         icon: Fan,          label: 'Fan' },
  { name: 'Wind',        icon: Wind,         label: 'Wind' },
  { name: 'Droplets',    icon: Droplets,     label: 'Water' },
  { name: 'Waves',       icon: Waves,        label: 'Waves' },
  { name: 'Cloud',       icon: Cloud,        label: 'Cloud' },
  { name: 'CloudRain',   icon: CloudRain,    label: 'Rain' },
  { name: 'Gauge',       icon: Gauge,        label: 'Gauge' },
  { name: 'Lock',        icon: Lock,         label: 'Lock' },
  { name: 'LockOpen',    icon: LockOpen,     label: 'Unlock' },
  { name: 'ShieldCheck', icon: ShieldCheck,  label: 'Shield' },
  { name: 'DoorOpen',    icon: DoorOpen,     label: 'Door' },
  { name: 'DoorClosed',  icon: DoorClosed,   label: 'Closed' },
  { name: 'Blinds',      icon: Blinds,       label: 'Blinds' },
  { name: 'Tv',          icon: Tv,           label: 'TV' },
  { name: 'Monitor',     icon: Monitor,      label: 'Screen' },
  { name: 'Speaker',     icon: Speaker,      label: 'Speaker' },
  { name: 'Camera',      icon: Camera,       label: 'Camera' },
  { name: 'Bell',        icon: Bell,         label: 'Bell' },
  { name: 'BellOff',     icon: BellOff,      label: 'Silent' },
  { name: 'Siren',       icon: Siren,        label: 'Siren' },
  { name: 'Power',       icon: Power,        label: 'Power' },
  { name: 'Plug',        icon: Plug,         label: 'Plug' },
  { name: 'PlugZap',     icon: PlugZap,      label: 'Energy' },
  { name: 'Zap',         icon: Zap,          label: 'Zap' },
  { name: 'Wifi',        icon: Wifi,         label: 'WiFi' },
  { name: 'Car',         icon: Car,          label: 'Car' },
  { name: 'Home',        icon: Home,         label: 'Home' },
  { name: 'Building2',   icon: Building2,    label: 'Building' },
  { name: 'Sofa',        icon: Sofa,         label: 'Sofa' },
  { name: 'Bed',         icon: Bed,          label: 'Bed' },
  { name: 'Coffee',      icon: Coffee,       label: 'Coffee' },
  { name: 'Star',        icon: Star,         label: 'Star' },
]

const ICON_MAP = new Map(ICON_OPTIONS.map((o) => [o.name, o.icon]))

export function getIconByName(name: string): LucideIcon | null {
  return ICON_MAP.get(name) ?? null
}

/** Resolve a custom icon from the entity-icon map, or null if none is assigned */
export function resolveEntityIcon(
  entityIcons: Record<string, string>,
  entityId: string,
): LucideIcon | null {
  const name = entityIcons[entityId]
  return name ? (ICON_MAP.get(name) ?? null) : null
}
