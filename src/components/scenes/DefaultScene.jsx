import { useEffect, useRef } from 'react'
import useCanvasSize from '../../lib/useCanvasSize'

export default function DefaultScene({ animated }) {
  const canvasRef = useRef(null)
  const shapesRef = useRef([])

  useCanvasSize(canvasRef)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const colors = ['#ffecd2', '#fcb69f', '#a18cd1', '#fbc2eb', '#ffdde1']

    if (!shapesRef.current.length) {
      shapesRef.current = Array.from({ length: 20 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: (20 + Math.random() * 40) * (canvas.width / 800 + 0.5),
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: -0.2 - Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 0.5,
        rot: Math.random() * 360,
        rv: (Math.random() - 0.5) * 1,
      }))
    }

    const drawFrame = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      for (const s of shapesRef.current) {
        s.y += s.vy; s.x += s.vx; s.rot += s.rv
        if (s.y < -s.size) { s.y = h + s.size; s.x = Math.random() * w }
        if (s.x < -s.size) s.x = w + s.size
        if (s.x > w + s.size) s.x = -s.size
        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate((s.rot * Math.PI) / 180)
        ctx.globalAlpha = 0.3
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(0, 0, s.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
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
  }, [animated])

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}
