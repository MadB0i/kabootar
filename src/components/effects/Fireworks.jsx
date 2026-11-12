import { useEffect, useRef } from 'react'
import useCanvasSize from '../../lib/useCanvasSize'

/** One requestAnimationFrame loop + one launch timer for the whole canvas. */
export default function Fireworks() {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])

  useCanvasSize(canvasRef)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#a18cd1', '#fff']

    const launch = () => {
      const w = canvas.width
      const h = canvas.height
      const x = w * (0.2 + Math.random() * 0.6)
      const y = h * (0.15 + Math.random() * 0.4)
      const color = colors[Math.floor(Math.random() * colors.length)]
      const speedScale = Math.min(w, h) / 700
      const particleCount = 40
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.2
        const speed = (2 + Math.random() * 3) * Math.max(0.6, speedScale)
        particlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.015 + Math.random() * 0.01,
          color,
          size: 2 + Math.random() * 2,
        })
      }
    }

    const launchTimer = setInterval(launch, 500)

    let raf = 0
    const loop = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'lighter'
      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05 * Math.max(0.6, Math.min(w, h) / 700)
        p.life -= p.decay
        if (p.life <= 0 || p.x < -50 || p.x > w + 50 || p.y > h + 50) {
          particles.splice(i, 1)
          continue
        }
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      clearInterval(launchTimer)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}
