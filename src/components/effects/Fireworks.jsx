import { useEffect, useRef, useCallback } from 'react'
import useCanvasSize from '../../lib/useCanvasSize'
import { playFirework } from '../../lib/sound'

/** One requestAnimationFrame loop + launch timer + tap to launch. */
export default function Fireworks() {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])

  useCanvasSize(canvasRef)

  const launchAt = useCallback((x, y) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#a18cd1', '#fff', '#ff9a9e']
    const color = colors[Math.floor(Math.random() * colors.length)]
    const speedScale = Math.min(canvas.width, canvas.height) / 700
    const particleCount = 42

    playFirework()

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.2
      const speed = (2.5 + Math.random() * 3.5) * Math.max(0.6, speedScale)
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.014 + Math.random() * 0.01,
        color,
        size: 2 + Math.random() * 2.5,
      })
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const launchAuto = () => {
      const w = canvas.width
      const h = canvas.height
      const x = w * (0.2 + Math.random() * 0.6)
      const y = h * (0.15 + Math.random() * 0.4)
      launchAt(x, y)
    }

    const launchTimer = setInterval(launchAuto, 700)

    let raf = 0
    const loop = () => {
      const w = canvas.width
      const h = canvas.height
      // Fade previous particles without turning transparent canvas background black
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
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
  }, [launchAt])

  const handlePointerDown = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    launchAt(x, y)
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      className="absolute inset-0 w-full h-full pointer-events-auto cursor-pointer"
    />
  )
}
