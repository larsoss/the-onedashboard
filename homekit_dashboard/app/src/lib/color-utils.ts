/** Convert HSV (hue 0-360, sat 0-100, val 0-100) → RGB [0-255, 0-255, 0-255] */
export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  s /= 100; v /= 100
  const i = Math.floor(h / 60) % 6
  const f = h / 60 - Math.floor(h / 60)
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  const m: [number, number, number][] = [
    [v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q],
  ]
  const [r, g, b] = m[i]
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

/** Format HSV as CSS rgb() string */
export function hsvToCssRgb(h: number, s: number): string {
  const [r, g, b] = hsvToRgb(h, s, 100)
  return `${r},${g},${b}`
}

/** Mireds → Kelvin */
export function miredsToKelvin(mireds: number): number {
  return Math.round(1_000_000 / mireds)
}

/** Kelvin → Mireds */
export function kelvinToMireds(kelvin: number): number {
  return Math.round(1_000_000 / kelvin)
}
