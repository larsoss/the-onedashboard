export type AccentColor = 'blue' | 'teal' | 'purple' | 'green' | 'amber'
export type TileStyle = 'glass' | 'solid'
export type BgStyle = 'dark' | 'black' | 'navy' | 'slate'
export type TileSize = 'compact' | 'normal' | 'large'
export type TileShape = 'square' | 'rect'
export type IconSize = 'small' | 'medium' | 'large'

export interface ThemeConfig {
  accent: AccentColor
  tileStyle: TileStyle
  bgStyle: BgStyle
  tileSize: TileSize
  tileShape: TileShape
  iconSize: IconSize
  tileOpacity: number   // 10–100
}

export const DEFAULT_THEME: ThemeConfig = {
  accent: 'blue',
  tileStyle: 'glass',
  bgStyle: 'dark',
  tileSize: 'normal',
  tileShape: 'square',
  iconSize: 'medium',
  tileOpacity: 80,
}

import { userKey } from './user-context'

function key() { return userKey('hk_theme') }

export function getTheme(): ThemeConfig {
  try {
    return { ...DEFAULT_THEME, ...(JSON.parse(localStorage.getItem(key()) ?? '{}') as Partial<ThemeConfig>) }
  } catch {
    return DEFAULT_THEME
  }
}

export function saveTheme(t: ThemeConfig): void {
  localStorage.setItem(key(), JSON.stringify(t))
}

/** Background CSS values per bgStyle */
export const BG_VALUES: Record<BgStyle, string> = {
  dark:  'radial-gradient(ellipse at 25% 0%, #2a2a3c 0%, #1C1C1E 55%, #111111 100%)',
  black: '#000000',
  navy:  'linear-gradient(145deg, #0d1b2a 0%, #1a2540 60%, #0a1628 100%)',
  slate: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
}

/** Tailwind class sets per accent color — all strings must be statically present */
export const ACCENT_CLASSES = {
  blue:   { bg: 'bg-ios-blue',   bgLight: 'bg-ios-blue/20',   text: 'text-ios-blue',   border: 'border-ios-blue' },
  teal:   { bg: 'bg-ios-teal',   bgLight: 'bg-ios-teal/20',   text: 'text-ios-teal',   border: 'border-ios-teal' },
  purple: { bg: 'bg-ios-purple', bgLight: 'bg-ios-purple/20', text: 'text-ios-purple', border: 'border-ios-purple' },
  green:  { bg: 'bg-ios-green',  bgLight: 'bg-ios-green/20',  text: 'text-ios-green',  border: 'border-ios-green' },
  amber:  { bg: 'bg-ios-amber',  bgLight: 'bg-ios-amber/20',  text: 'text-ios-amber',  border: 'border-ios-amber' },
} as const

export const ACCENT_HEX: Record<AccentColor, string> = {
  blue:   '#0A84FF',
  teal:   '#5AC8FA',
  purple: '#BF5AF2',
  green:  '#30D158',
  amber:  '#FF9F0A',
}

export const BG_PREVIEW: Record<BgStyle, string> = {
  dark:  '#1C1C1E',
  black: '#000000',
  navy:  '#0d1b2a',
  slate: '#1e293b',
}

/** Responsive grid column classes per tile size */
export const GRID_COLS: Record<TileSize, string> = {
  compact: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8',
  normal:  'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5',
  large:   'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4',
}

/** Tile aspect ratio class per shape */
export const TILE_ASPECT: Record<TileShape, string> = {
  square: 'aspect-square',
  rect:   'aspect-[3/2]',
}

/** Icon container size class per iconSize */
export const ICON_SIZE_CLASS: Record<IconSize, string> = {
  small:  'w-5 h-5',
  medium: 'w-8 h-8',
  large:  'w-11 h-11',
}
