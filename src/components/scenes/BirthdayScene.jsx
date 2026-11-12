import { useEffect, useRef, useState } from 'react'
import useCanvasSize from '../../lib/useCanvasSize'
import Confetti from '../effects/Confetti'

const CANDLE_COUNT = 5

export default function BirthdayScene({ animated }) {
  const canvasRef = useRef(null)
  const candlesRef = useRef([])
  const blownRef = useRef(false)
  const micCleanupRef = useRef(null)
  const [blown, setBlown] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  useCanvasSize(canvasRef)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const drawFrame = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      // Cake sits low so the viewer's card text never covers it
      ctx.fillStyle = '#f4a460'
      ctx.fillRect(w * 0.2, h * 0.78, w * 0.6, h * 0.14)
      ctx.fillStyle = '#ffb6c1'
      ctx.fillRect(w * 0.2, h * 0.73, w * 0.6, h * 0.09)
      // Candles: positions follow current size, flame state lives in the ref
      for (let i = 0; i < CANDLE_COUNT; i++) {
        const c = candlesRef.current[i] || (candlesRef.current[i] = { flameActive: true })
        const x = w * 0.3 + (i / (CANDLE_COUNT - 1)) * w * 0.4
        const y = h * 0.7
        ctx.fillStyle = '#fff'
        ctx.fillRect(x - 3, y - h * 0.045, 6, h * 0.045)
        if (c.flameActive) {
          ctx.fillStyle = '#ffa500'
          ctx.beginPath()
          ctx.ellipse(x, y - h * 0.055, 5, h * 0.015, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    if (!animated) {
      drawFrame() // flat mode: one static frame
      return
    }
    let raf = 0
    const loop = () => {
      drawFrame()
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [animated])

  // Stop mic detection on unmount.
  useEffect(() => () => micCleanupRef.current?.(), [])

  // Confetti bursts once, then unmounts.
  useEffect(() => {
    if (!celebrate) return
    const t = setTimeout(() => setCelebrate(false), 5000)
    return () => clearTimeout(t)
  }, [celebrate])

  const blowOut = () => {
    if (blownRef.current) return
    blownRef.current = true
    micCleanupRef.current?.()
    candlesRef.current.forEach((c) => { c.flameActive = false })
    setBlown(true)
    setCelebrate(true)
  }

  // Mic is requested ONLY on this tap, then blowing is detected by loudness.
  const blowWithMic = async () => {
    let stream
    let audioCtx
    let raf = 0
    micCleanupRef.current = () => {
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      audioCtx?.close().catch(() => {})
      micCleanupRef.current = null
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioCtx = new AudioContext()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      audioCtx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const detect = () => {
        if (blownRef.current) return
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        if (avg > 80) {
          micCleanupRef.current?.()
          blowOut()
          return
        }
        raf = requestAnimationFrame(detect)
      }
      detect()
    } catch {
      micCleanupRef.current = null
      blowOut() // mic denied/unavailable — still let them celebrate
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {celebrate && <Confetti count={120} />}

      {!blown && (
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 px-4">
          <div className="flex gap-3">
            <button
              onClick={blowWithMic}
              data-interactive
              className="pointer-events-auto px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-full font-bold shadow-lg transition-colors"
            >
              Blow with mic 🎤
            </button>
            <button
              onClick={blowOut}
              data-interactive
              className="pointer-events-auto px-5 py-2.5 bg-white/90 hover:bg-white text-gray-900 rounded-full font-bold shadow-lg transition-colors"
            >
              Tap to blow 💨
            </button>
          </div>
          <p className="text-white text-xs opacity-70">Make a wish first ✨</p>
        </div>
      )}
      {blown && (
        <p className="absolute bottom-24 left-0 right-0 text-center text-yellow-200 text-xl font-bold drop-shadow-lg pointer-events-none">
          🎉 Make a wish! 🎉
        </p>
      )}
    </div>
  )
}
