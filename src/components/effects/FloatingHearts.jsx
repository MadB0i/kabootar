import { useEffect, useRef } from 'react'
import useCanvasSize from '../../lib/useCanvasSize'

const COLORS = ['#ff6b9d', '#ff8fab', '#e64980', '#f72585']

export default function FloatingHearts({ count = 60 }) {
  const canvasRef = useRef(null)
  const heartsRef = useRef([])

  useCanvasSize(canvasRef)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    heartsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: 8 + Math.random() * 12,
      speed: 0.5 + Math.random() * 1.5,
      opacity: 0.3 + Math.random() * 0.5,
      sway: Math.random() * 2 - 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)], // fixed at spawn
    }))

    const drawHeart = (cx, cy, size, color) => {
      ctx.fillStyle = color
      ctx.beginPath()
      const s = size / 2
      ctx.moveTo(cx, cy + s / 4)
      ctx.bezierCurveTo(cx, cy, cx - s, cy, cx - s, cy + s / 4)
      ctx.bezierCurveTo(cx - s, cy + s / 2, cx, cy + s * 1.5, cx, cy + s * 2)
      ctx.bezierCurveTo(cx, cy + s * 1.5, cx + s, cy + s / 2, cx + s, cy + s / 4)
      ctx.bezierCurveTo(cx + s, cy, cx, cy, cx, cy + s / 4)
      ctx.closePath()
      ctx.fill()
    }

    let raf = 0
    const loop = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      for (const heart of heartsRef.current) {
        heart.y -= heart.speed
        heart.x += Math.sin(heart.y * 0.02) * heart.sway
        if (heart.y < -20) {
          heart.y = h + 20
          heart.x = Math.random() * w
        }
        drawHeart(heart.x, heart.y, heart.size, heart.color)
      }
      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => cancelAnimationFrame(raf)
  }, [count])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}
