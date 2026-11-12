import { useEffect } from 'react'

/** Keep a canvas' backing store matched to its parent element's size,
 *  using devicePixelRatio capped at 2. Re-runs on resize via ResizeObserver. */
export default function useCanvasSize(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement || canvas

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = parent.clientWidth
      const h = parent.clientHeight
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(parent)
    window.addEventListener('resize', resize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [canvasRef])
}
