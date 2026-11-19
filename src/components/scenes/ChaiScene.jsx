import { useEffect, useRef, useState, useCallback } from 'react'
import useCanvasSize from '../../lib/useCanvasSize'
import { playHeartPop, triggerHaptic } from '../../lib/sound'

export default function ChaiScene({ animated, toName }) {
  const canvasRef = useRef(null)
  const steamParticlesRef = useRef([])
  const [cupTapped, setCupTapped] = useState(false)

  useCanvasSize(canvasRef)

  const addSteamBurst = useCallback((cx, cy) => {
    playHeartPop()
    triggerHaptic([20])
    setCupTapped(true)
    for (let i = 0; i < 15; i++) {
      steamParticlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy - 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1.5 - Math.random() * 2,
        size: 8 + Math.random() * 14,
        alpha: 0.8,
        decay: 0.008 + Math.random() * 0.008,
        isHeart: Math.random() > 0.4,
      })
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0

    const drawFrame = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      const cupX = w * 0.5
      const cupY = h * 0.76
      const cupW = Math.min(w * 0.28, 110)
      const cupH = cupW * 1.25

      // Continuous gentle steam
      if (Math.random() > 0.82) {
        steamParticlesRef.current.push({
          x: cupX + (Math.random() - 0.5) * (cupW * 0.6),
          y: cupY - cupH * 0.45,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.8 - Math.random() * 1.2,
          size: 6 + Math.random() * 10,
          alpha: 0.4,
          decay: 0.006 + Math.random() * 0.006,
          isHeart: Math.random() > 0.6,
        })
      }

      // Draw Chai Glass / Cup
      // Saucer / plate
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.beginPath()
      ctx.ellipse(cupX, cupY + cupH * 0.48, cupW * 0.75, cupH * 0.12, 0, 0, Math.PI * 2)
      ctx.fill()

      // Cutting chai glass body (tapered cylinder)
      ctx.save()
      ctx.fillStyle = 'rgba(245, 166, 35, 0.85)' // warm rich cutting chai color
      ctx.beginPath()
      ctx.moveTo(cupX - cupW * 0.42, cupY - cupH * 0.4)
      ctx.lineTo(cupX + cupW * 0.42, cupY - cupH * 0.4)
      ctx.lineTo(cupX + cupW * 0.32, cupY + cupH * 0.42)
      ctx.lineTo(cupX - cupW * 0.32, cupY + cupH * 0.42)
      ctx.closePath()
      ctx.fill()

      // Froth on top
      ctx.fillStyle = '#fce4c8'
      ctx.beginPath()
      ctx.ellipse(cupX, cupY - cupH * 0.4, cupW * 0.42, cupH * 0.1, 0, 0, Math.PI * 2)
      ctx.fill()

      // Glass reflections
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(cupX - cupW * 0.32, cupY - cupH * 0.32)
      ctx.lineTo(cupX - cupW * 0.24, cupY + cupH * 0.32)
      ctx.stroke()
      ctx.restore()

      // Draw steam particles
      const particles = steamParticlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.size += 0.2
        p.alpha -= p.decay

        if (p.alpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.globalAlpha = p.alpha
        if (p.isHeart) {
          ctx.fillStyle = 'rgba(255, 182, 193, 0.85)'
          ctx.font = `${p.size}px sans-serif`
          ctx.fillText('💖', p.x, p.y)
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      if (animated) {
        raf = requestAnimationFrame(drawFrame)
      }
    }

    drawFrame()
    return () => cancelAnimationFrame(raf)
  }, [animated])

  const handleTap = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    addSteamBurst(x, y)
  }

  return (
    <div
      onClick={handleTap}
      className="relative w-full h-full overflow-hidden cursor-pointer"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <p className="absolute bottom-6 left-0 right-0 text-center text-amber-100 text-xs opacity-75 pointer-events-none">
        {cupTapped ? `☕ Chai on me, ${toName || 'friend'}!` : 'Tap anywhere to brew more steam ✨'}
      </p>
    </div>
  )
}
