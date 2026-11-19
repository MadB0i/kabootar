import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import useCanvasSize from '../../lib/useCanvasSize'
import Confetti from '../effects/Confetti'
import { playScratch, playSparkle, triggerHaptic } from '../../lib/sound'

export default function ScratchScene({ animated, toName }) {
  const canvasRef = useRef(null)
  const isScratchingRef = useRef(false)
  const scratchCountRef = useRef(0)
  const lastSoundRef = useRef(0)
  const [revealed, setRevealed] = useState(false)
  const [percentScratched, setPercentScratched] = useState(0)

  useCanvasSize(canvasRef)

  // Initialize canvas with metallic gold/silver foil texture
  const drawFoil = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    if (w <= 0 || h <= 0) return

    ctx.globalCompositeOperation = 'source-over'

    // Metallic gradient
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#d4af37') // metallic gold
    grad.addColorStop(0.25, '#fff2a8')
    grad.addColorStop(0.5, '#c59b27')
    grad.addColorStop(0.75, '#f7e279')
    grad.addColorStop(1, '#aa771c')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Subtle brushed metallic noise lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1
    for (let i = 0; i < 40; i++) {
      ctx.beginPath()
      const y = Math.random() * h
      ctx.moveTo(0, y)
      ctx.lineTo(w, y + (Math.random() - 0.5) * 20)
      ctx.stroke()
    }

    // Foil seal text & icon
    ctx.fillStyle = '#4a3600'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `bold ${Math.max(14, Math.min(w, h) * 0.055)}px sans-serif`
    ctx.fillText('🪙 SCRATCH WITH FINGER OR MOUSE', w / 2, h * 0.44)

    ctx.font = `${Math.max(12, Math.min(w, h) * 0.04)}px sans-serif`
    ctx.fillStyle = '#6b4f00'
    ctx.fillText('✨ A secret message is hidden underneath ✨', w / 2, h * 0.53)
  }, [])

  useEffect(() => {
    if (!revealed) {
      drawFoil()
    }
  }, [drawFoil, revealed])

  // Calculate percentage cleared
  const checkProgress = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || revealed) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    // Sample a 50x50 grid for performance
    try {
      const imgData = ctx.getImageData(0, 0, w, h)
      let cleared = 0
      const totalSamples = 1000
      const step = Math.floor(imgData.data.length / (totalSamples * 4))
      for (let i = 0; i < imgData.data.length; i += step * 4) {
        if (imgData.data[i + 3] === 0) {
          cleared++
        }
      }
      const ratio = cleared / totalSamples
      const pct = Math.round(ratio * 100)
      setPercentScratched(pct)

      if (ratio > 0.42) {
        setRevealed(true)
        playSparkle()
        triggerHaptic([40, 40, 80])
      }
    } catch {
      // Security/CORS fallback if canvas tainted
    }
  }, [revealed])

  // Scratch action
  const scratch = useCallback((clientX, clientY) => {
    if (revealed) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * canvas.width
    const y = ((clientY - rect.top) / rect.height) * canvas.height

    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    const radius = Math.max(26, Math.min(canvas.width, canvas.height) * 0.08)
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()

    // Sound and haptic throttled
    const now = Date.now()
    if (now - lastSoundRef.current > 80) {
      lastSoundRef.current = now
      playScratch()
      triggerHaptic([12])
    }

    scratchCountRef.current += 1
    if (scratchCountRef.current % 12 === 0) {
      checkProgress()
    }
  }, [checkProgress, revealed])

  const handlePointerDown = (e) => {
    isScratchingRef.current = true
    scratch(e.clientX, e.clientY)
  }

  const handlePointerMove = (e) => {
    if (!isScratchingRef.current) return
    scratch(e.clientX, e.clientY)
  }

  const handlePointerUp = () => {
    isScratchingRef.current = false
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      {revealed && animated && <Confetti count={100} />}

      {/* Behind the foil: Special glowing emblem */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.05, 1], opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-32 h-32 rounded-full bg-pink-500/20 blur-2xl absolute"
        />
        <p className="text-4xl sm:text-5xl mb-2 drop-shadow-lg">💖</p>
        <p className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-md">
          {toName ? `For ${toName}` : 'Secret Unlocked!'}
        </p>
      </div>

      {/* Foil Scratch Overlay Canvas */}
      {!revealed && (
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute inset-4 sm:inset-12 w-[calc(100%-2rem)] sm:w-[calc(100%-6rem)] h-[calc(100%-2rem)] sm:h-[calc(100%-6rem)] rounded-3xl shadow-2xl cursor-pointer touch-none z-10 pointer-events-auto ring-2 ring-amber-300/40"
        />
      )}

      {/* Progress pill */}
      {!revealed && percentScratched > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-amber-200 text-xs font-semibold ring-1 ring-white/10 pointer-events-none">
          {percentScratched}% Scratched
        </div>
      )}

      {revealed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 px-5 py-2 rounded-full bg-pink-500/80 backdrop-blur-md text-white text-sm font-bold shadow-lg ring-1 ring-white/20 pointer-events-none"
        >
          ✨ Secret Revealed! ✨
        </motion.div>
      )}
    </div>
  )
}
