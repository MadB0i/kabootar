import { useEffect, useRef } from 'react'

export default function Confetti({ count = 100 }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w, h

    const resize = () => {
      w = canvas.width = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeee8']
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: Math.random() * w,
        y: -Math.random() * h,
        w: 4 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        vy: 1 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 2,
        rot: Math.random() * 360,
        rv: (Math.random() - 0.5) * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    const loop = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particlesRef.current) {
        p.y += p.vy
        p.x += p.vx
        p.rot += p.rv
        if (p.y > h + 20) {
          p.y = -20
          p.x = Math.random() * w
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
      animRef.current = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [count])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
}
