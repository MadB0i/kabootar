import { useEffect, useRef } from 'react'
import useCanvasSize from '../../lib/useCanvasSize'

const COLORS = ['#ffb7c5', '#ffcdd2', '#f8bbd0', '#fce4ec']

export default function Petals({ count = 50 }) {
  const canvasRef = useRef(null)
  const petalsRef = useRef([])

  useCanvasSize(canvasRef)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    petalsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: 5 + Math.random() * 8,
      speed: 0.5 + Math.random() * 1.5,
      sway: Math.random() * 2 - 1,
      rot: Math.random() * 360,
      rv: (Math.random() - 0.5) * 3,
      opacity: 0.4 + Math.random() * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)], // fixed at spawn
    }))

    let raf = 0
    const loop = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      for (const p of petalsRef.current) {
        p.y += p.speed
        p.x += Math.sin(p.y * 0.01) * p.sway
        p.rot += p.rv
        if (p.y > h + 20) {
          p.y = -20
          p.x = Math.random() * w
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => cancelAnimationFrame(raf)
  }, [count])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}
