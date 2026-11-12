import { useEffect, useRef } from 'react'
import useCanvasSize from '../../lib/useCanvasSize'

/** Sample points from text rendered on an offscreen canvas.
 *  The name forms in the upper third so viewer cards never cover it. */
function sampleTextPoints(text, width, height, fontSize) {
  // Guard against zero-width/height canvases.
  if (!text || width <= 0 || height <= 0 || fontSize <= 0) return []
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height * 0.22)
  const imageData = ctx.getImageData(0, 0, width, height)
  const points = []
  const step = 4
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      if (imageData.data[i + 3] > 128) {
        points.push({ x, y })
      }
    }
  }
  return points
}

export default function RomanticScene({ animated, toName }) {
  const canvasRef = useRef(null)
  const starsRef = useRef([])
  const pointsRef = useRef(null)
  const dimsRef = useRef({ w: 0, h: 0 })

  useCanvasSize(canvasRef)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    starsRef.current = []
    pointsRef.current = null
    dimsRef.current = { w: 0, h: 0 }
    let frame = 0

    // (Re)sample the name whenever the canvas size changes.
    const ensureTargets = () => {
      const w = canvas.width
      const h = canvas.height
      if (pointsRef.current && dimsRef.current.w === w && dimsRef.current.h === h) return
      dimsRef.current = { w, h }
      const pts = sampleTextPoints(toName, w, h, Math.min(w, h) * 0.2)
      pointsRef.current = pts
      const stars = starsRef.current
      if (stars.length === 0) {
        for (let i = 0; i < 400; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            size: 1 + Math.random() * 2,
            drift: (Math.random() - 0.5) * 0.3,
            target: pts.length > 0 ? pts[i % pts.length] : null,
          })
        }
      } else {
        for (let i = 0; i < stars.length; i++) {
          stars[i].target = pts.length > 0 ? pts[i % pts.length] : null
        }
      }
    }

    const drawFrame = () => {
      const w = canvas.width
      const h = canvas.height
      ensureTargets()
      ctx.fillStyle = '#0a0a1a'
      ctx.fillRect(0, 0, w, h)
      frame++
      for (const star of starsRef.current) {
        if (star.target) {
          star.x += (star.target.x - star.x) * 0.01
          star.y += (star.target.y - star.y) * 0.01
        } else {
          star.x += star.drift
          if (star.x > w) star.x = 0
          if (star.x < 0) star.x = w
        }
        ctx.globalAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame * 0.03 + star.y))
        ctx.fillStyle = '#ffd700'
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
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
  }, [animated, toName])

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}
