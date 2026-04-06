export type TileSpan = '1x1' | '2x1' | '1x2' | '2x2'
export type EntityTileSizes = Record<string, TileSpan>

const KEY = 'hk_tile_sizes'

export function getTileSizes(): EntityTileSizes {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as EntityTileSizes
  } catch {
    return {}
  }
}

export function saveTileSizes(sizes: EntityTileSizes): void {
  localStorage.setItem(KEY, JSON.stringify(sizes))
}

/** Tailwind col/row span classes per TileSpan */
export const SPAN_CLASSES: Record<TileSpan, string> = {
  '1x1': 'col-span-1 row-span-1',
  '2x1': 'col-span-2 row-span-1',
  '1x2': 'col-span-1 row-span-2',
  '2x2': 'col-span-2 row-span-2',
}
