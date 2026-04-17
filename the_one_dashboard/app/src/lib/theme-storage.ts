export type TileStyle = 'glass' | 'solid'
export type BgStyle = 'dark' | 'black' | 'navy' | 'slate' | 'warm' | 'purple' | 'forest' | 'cyber'
export type TileSize = 'compact' | 'normal' | 'large'
export type TileShape = 'square' | 'rect'
export type IconSize = 'small' | 'medium' | 'large'

/** Accent is stored as a hue value 0–360 */
export interface ThemeConfig {
  accent: number
  tileStyle: TileStyle
  bgStyle: BgStyle
  tileSize: TileSize
  tileShape: TileShape
  iconSize: IconSize
  tileOpacity: number   // 10–100
  tileGlow: boolean     // neon border glow on glass tiles
  moodId?: string       // currently active mood preset (undefined = custom)
}

export const DEFAULT_THEME: ThemeConfig = {
  accent: 211,          // iOS blue hue
  tileStyle: 'glass',
  bgStyle: 'dark',
  tileSize: 'normal',
  tileShape: 'square',
  iconSize: 'medium',
  tileOpacity: 80,
  tileGlow: false,
  moodId: 'ios-dark',
}

// ── Color Moods ────────────────────────────────────────────────────────────────

export interface ColorMood {
  id: string
  name: string
  desc: string
  /** 4–5 preview swatch colors (CSS color strings) */
  swatches: string[]
  /** Theme values applied when this mood is selected */
  accent: number
  bgStyle: BgStyle
  tileStyle: TileStyle
  tileOpacity: number
  tileGlow?: boolean
}

export const COLOR_MOODS: ColorMood[] = [
  {
    id: 'ios-dark',
    name: 'iOS Dark',
    desc: 'Classic · Dark · Balanced',
    swatches: ['#0A84FF', '#30D158', '#FF9F0A', '#3A3A3C', '#1C1C1E'],
    accent: 211, bgStyle: 'dark', tileStyle: 'glass', tileOpacity: 80,
  },
  {
    id: 'warm-neutrals',
    name: 'Warm Neutrals',
    desc: 'Cozy · Amber · Warm',
    swatches: ['#FF9F0A', '#D4874A', '#A06030', '#3D2010', '#1A0D05'],
    accent: 35, bgStyle: 'warm', tileStyle: 'glass', tileOpacity: 75,
  },
  {
    id: 'moody-dark',
    name: 'Moody Dark',
    desc: 'Dark · Artistic · Luxury',
    swatches: ['#BF5AF2', '#9B3FCC', '#6B1F99', '#2D0D54', '#110520'],
    accent: 280, bgStyle: 'purple', tileStyle: 'glass', tileOpacity: 70,
  },
  {
    id: 'clean-bright',
    name: 'Clean & Bright',
    desc: 'Clean · Distinct · Trustworthy',
    swatches: ['#E5E5EA', '#AEAEB2', '#636366', '#3A3A3C', '#1C1C1E'],
    accent: 211, bgStyle: 'slate', tileStyle: 'solid', tileOpacity: 100,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    desc: 'Deep · Calm · Fresh',
    swatches: ['#5AC8FA', '#0A84FF', '#0055CC', '#002255', '#000F2B'],
    accent: 200, bgStyle: 'navy', tileStyle: 'glass', tileOpacity: 80,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    desc: 'Minimal · Focused · Pure',
    swatches: ['#6E7FF3', '#4455EE', '#2233CC', '#111133', '#000000'],
    accent: 240, bgStyle: 'black', tileStyle: 'glass', tileOpacity: 65,
  },
  {
    id: 'forest',
    name: 'Forest',
    desc: 'Natural · Fresh · Calm',
    swatches: ['#30D158', '#1DB954', '#0F7A38', '#073D18', '#021508'],
    accent: 142, bgStyle: 'forest', tileStyle: 'glass', tileOpacity: 80,
  },
  {
    id: 'sunset',
    name: 'Sunset',
    desc: 'Bold · Warm · Energetic',
    swatches: ['#FF453A', '#FF6B35', '#FF9F0A', '#661100', '#2A0500'],
    accent: 15, bgStyle: 'warm', tileStyle: 'glass', tileOpacity: 80,
  },
  {
    id: 'cyber',
    name: 'Cyber Glass',
    desc: 'Neon · Holographic · Futuristic',
    swatches: ['#00E5FF', '#7B2FFF', '#FF2D78', '#0D1040', '#060820'],
    accent: 190, bgStyle: 'cyber', tileStyle: 'glass', tileOpacity: 70, tileGlow: true,
  },
]

/** Named hue values for backward compat with old stored strings */
const LEGACY_HUE: Record<string, number> = {
  blue: 211, teal: 200, purple: 280, green: 142, amber: 37,
}

/** Convert any stored accent value (old string or new number) to a hue */
export function resolveAccentHue(raw: unknown): number {
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string' && raw in LEGACY_HUE) return LEGACY_HUE[raw]
  return DEFAULT_THEME.accent
}

/** CSS color string for the accent hue */
export function accentHex(hue: number): string {
  return `hsl(${hue}, 80%, 60%)`
}

/** HSLA with alpha */
export function accentHsla(hue: number, alpha: number): string {
  return `hsla(${hue}, 80%, 60%, ${alpha})`
}

import { userKey } from './user-context'

function key() { return userKey('hk_theme') }

export function getTheme(): ThemeConfig {
  try {
    const raw = JSON.parse(localStorage.getItem(key()) ?? '{}') as Record<string, unknown>
    const merged = { ...DEFAULT_THEME, ...raw } as ThemeConfig
    // Migrate legacy string accent → hue number
    merged.accent = resolveAccentHue(raw.accent ?? merged.accent)
    // Default tileGlow to false for existing installs
    if (typeof merged.tileGlow !== 'boolean') merged.tileGlow = false
    return merged
  } catch {
    return DEFAULT_THEME
  }
}

export function saveTheme(t: ThemeConfig): void {
  localStorage.setItem(key(), JSON.stringify(t))
}

/** Background CSS values per bgStyle */
export const BG_VALUES: Record<BgStyle, string> = {
  dark:   'radial-gradient(ellipse at 25% 0%, #2a2a3c 0%, #1C1C1E 55%, #111111 100%)',
  black:  '#000000',
  navy:   'linear-gradient(145deg, #0d1b2a 0%, #1a2540 60%, #0a1628 100%)',
  slate:  'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
  warm:   'radial-gradient(ellipse at 30% 0%, #2a1a08 0%, #1a0e04 60%, #0d0700 100%)',
  purple: 'radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #0f0620 60%, #060311 100%)',
  forest: 'linear-gradient(145deg, #0a1f0d 0%, #061209 60%, #020805 100%)',
  cyber:  'radial-gradient(ellipse at 20% 10%, #1a0a38 0%, #0d1040 35%, #060c20 65%, #030610 100%)',
}

export const BG_PREVIEW: Record<BgStyle, string> = {
  dark:   '#1C1C1E',
  black:  '#000000',
  navy:   '#0d1b2a',
  slate:  '#1e293b',
  warm:   '#1a0e04',
  purple: '#0f0620',
  forest: '#0a1f0d',
  cyber:  '#0d1040',
}

/** Responsive grid column classes per tile size.
 *  Column count is doubled vs the visual tile count so that the 'half' span
 *  (col-span-1) renders as exactly half the width of a normal tile (col-span-2). */
export const GRID_COLS: Record<TileSize, string> = {
  compact: 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-12',
  normal:  'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-8 xl:grid-cols-10',
  large:   'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8',
}

/** Fixed row height in px per tile size (rows don't grow with content) */
export const TILE_ROW_H: Record<TileSize, number> = {
  compact: 80,
  normal:  112,
  large:   152,
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
