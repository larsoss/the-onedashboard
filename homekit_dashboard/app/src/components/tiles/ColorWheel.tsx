import { useRef, useEffect, useCallback } from 'react'
import { hsvToRgb } from '@/lib/color-utils'

const CANVAS_SIZE = 300

interface ColorWheelProps {
  hue: number        // 0-360
  saturation: number // 0-100
  onChange: (hue: number, saturation: number) => void
}

export function ColorWheel({ hue, saturation, onChange }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const radius = CANVAS_SIZE / 2

  // Draw the wheel once on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE)

    for (let py = 0; py < CANVAS_SIZE; py++) {
      for (let px = 0; px < CANVAS_SIZE; px++) {
        const dx = px - radius
        const dy = py - radius
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > radius) continue

        const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
        const s = (dist / radius) * 100
        const [r, g, b] = hsvToRgb(h, s, 100)

        const i = (py * CANVAS_SIZE + px) * 4
        imageData.data[i]     = r
        imageData.data[i + 1] = g
        imageData.data[i + 2] = b
        // Feather the outer edge slightly
        imageData.data[i + 3] = dist > radius - 1.5 ? Math.round((radius - dist) / 1.5 * 255) : 255
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }, [radius])

  // Dot position as percentages
  const angleRad = (hue * Math.PI) / 180
  const dotDist = (saturation / 100) * radius
  const dotXPct = ((radius + dotDist * Math.cos(angleRad)) / CANVAS_SIZE) * 100
  const dotYPct = ((radius + dotDist * Math.sin(angleRad)) / CANVAS_SIZE) * 100

  const handleInteraction = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const scaleX = CANVAS_SIZE / rect.width
      const scaleY = CANVAS_SIZE / rect.height

      const px = (clientX - rect.left) * scaleX
      const py = (clientY - rect.top) * scaleY
      const dx = px - radius
      const dy = py - radius
      const rawDist = Math.sqrt(dx * dx + dy * dy)
      const clampedDist = Math.min(rawDist, radius)

      const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
      const s = (clampedDist / radius) * 100
      onChange(Math.round(h * 10) / 10, Math.round(s * 10) / 10)
    },
    [onChange, radius]
  )

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square select-none touch-none"
      onMouseDown={(e) => {
        isDragging.current = true
        handleInteraction(e.clientX, e.clientY)
      }}
      onMouseMove={(e) => {
        if (isDragging.current) handleInteraction(e.clientX, e.clientY)
      }}
      onMouseUp={() => { isDragging.current = false }}
      onMouseLeave={() => { isDragging.current = false }}
      onTouchStart={(e) => {
        isDragging.current = true
        handleInteraction(e.touches[0].clientX, e.touches[0].clientY)
      }}
      onTouchMove={(e) => {
        e.preventDefault()
        if (isDragging.current) handleInteraction(e.touches[0].clientX, e.touches[0].clientY)
      }}
      onTouchEnd={() => { isDragging.current = false }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="w-full h-full rounded-full cursor-crosshair"
      />
      {/* Picker dot */}
      <div
        className="absolute w-6 h-6 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${dotXPct}%`,
          top: `${dotYPct}%`,
          background: `hsl(${hue}, ${saturation}%, 50%)`,
          border: '2.5px solid white',
          boxShadow: '0 0 0 1.5px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.6)',
        }}
      />
    </div>
  )
}
