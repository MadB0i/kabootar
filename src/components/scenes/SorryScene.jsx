import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import useCanvasSize from '../../lib/useCanvasSize'
import Petals from '../effects/Petals'
import { playSparkle, playNahiDodge } from '../../lib/sound'

export default function SorryScene({ animated }) {
  const canvasRef = useRef(null)
  const dropsRef = useRef([])
  const [sunOut, setSunOut] = useState(false)

  useCanvasSize(canvasRef)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (!dropsRef.current.length) {
      dropsRef.current = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 4 + Math.random() * 4,
        len: 10 + Math.random() * 15,
      }))
    }

    const drawFrame = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      if (sunOut) {
        const sunX = w * 0.84
        const sunY = h * 0.16
        const sunR = Math.min(w, h) * 0.09
        const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 2.2)
        glow.addColorStop(0, 'rgba(255, 215, 0, 0.85)')
        glow.addColorStop(0.5, 'rgba(255, 180, 0, 0.35)')
        glow.addColorStop(1, 'rgba(255, 180, 0, 0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(sunX, sunY, sunR * 2.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffd700'
        ctx.beginPath()
        ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2)
        ctx.fill()
        return
      }
      ctx.fillStyle = 'rgba(15, 23, 42, 0.32)'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(174, 213, 255, 0.65)'
      ctx.lineWidth = 1.5
      for (const d of dropsRef.current) {
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x + 1, d.y + d.len)
        ctx.stroke()
        d.y += d.speed
        if (d.y > h) { d.y = -d.len; d.x = Math.random() * w }
      }
    }

    if (!animated) {
      drawFrame() // flat mode: one static frame, no rain motion
      return
    }
    let raf = 0
    const loop = () => {
      drawFrame()
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [animated, sunOut])

  const handleForgive = () => {
    setSunOut(true)
    playSparkle()
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {sunOut && animated && <Petals count={40} />}

      {!sunOut && (
      <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-4 px-4">
        <button
          onClick={handleForgive}
          data-interactive
          className="pointer-events-auto px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold text-lg shadow-lg transition-colors"
        >
          Haan 😊
        </button>
        {animated ? (
          <RunawayButton />
        ) : (
          /* Flat / reduced-motion: Nahi just fades out. */
          <motion.button
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            style={{ pointerEvents: 'none' }}
            className="px-8 py-3 bg-red-500 text-white rounded-full font-bold text-lg shadow-lg"
          >
            Nahi 😤
          </motion.button>
        )}
      </div>
      )}

      {sunOut && (
        <p className="absolute bottom-24 left-0 right-0 text-center text-yellow-200 text-xl font-bold drop-shadow-lg pointer-events-none">
          🌞 Maaf kar diye! 💕
        </p>
      )}
    </div>
  )
}

/** "Nahi" runs away from the pointer and touch — it can never be clicked. */
function RunawayButton() {
  const btnRef = useRef(null)
  const pointerRef = useRef({ x: -9999, y: -9999 })
  const [pos, setPos] = useState(null)

  const jump = useCallback(() => {
    playNahiDodge()
    const rect = btnRef.current?.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const bw = rect?.width || 120
    const bh = rect?.height || 52
    // Pick a spot well away from the pointer so it's never clickable.
    let left = 16
    let top = 16
    for (let i = 0; i < 10; i++) {
      left = 16 + Math.random() * Math.max(1, vw - bw - 32)
      top = 16 + Math.random() * Math.max(1, vh - bh - 32)
      const cx = left + bw / 2
      const cy = top + bh / 2
      if (Math.hypot(cx - pointerRef.current.x, cy - pointerRef.current.y) > 160) break
    }
    setPos({ left, top })
  }, [])

  useEffect(() => {
    const onMove = (e) => {
      pointerRef.current = { x: e.clientX, y: e.clientY }
      const rect = btnRef.current?.getBoundingClientRect()
      if (!rect) return
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      if (Math.hypot(e.clientX - cx, e.clientY - cy) < 110) jump()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [jump])

  const style = pos
    ? { position: 'fixed', left: pos.left, top: pos.top, zIndex: 40 }
    : undefined

  return (
    <button
      ref={btnRef}
      onPointerEnter={jump}
      onTouchStart={jump}
      onClick={jump}
      style={style}
      data-interactive
      className="pointer-events-auto px-8 py-3 bg-red-500 text-white rounded-full font-bold text-lg shadow-lg transition-none"
    >
      Nahi 😤
    </button>
  )
}
