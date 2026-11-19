import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createQRCodeMatrix } from '../lib/qrcode'
import { playSparkle, triggerHaptic } from '../lib/sound'

export default function StoryCardModal({ url, to, from, occasionLabel, theme, onClose }) {
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 1080
    const H = 1920
    canvas.width = W
    canvas.height = H

    // 1. Theme Gradient Background
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, theme.from || '#ff758c')
    grad.addColorStop(1, theme.to || '#ff7eb3')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // 2. Ambient light blobs & soft vignette
    const blob1 = ctx.createRadialGradient(W * 0.25, H * 0.25, 50, W * 0.25, H * 0.25, 500)
    blob1.addColorStop(0, 'rgba(255, 255, 255, 0.25)')
    blob1.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = blob1
    ctx.fillRect(0, 0, W, H)

    const blob2 = ctx.createRadialGradient(W * 0.8, H * 0.7, 50, W * 0.8, H * 0.7, 600)
    blob2.addColorStop(0, 'rgba(0, 0, 0, 0.25)')
    blob2.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = blob2
    ctx.fillRect(0, 0, W, H)

    // 3. Airmail dashed outer frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 4
    ctx.setLineDash([20, 15])
    ctx.strokeRect(60, 60, W - 120, H - 120)
    ctx.setLineDash([])

    // 4. Header Stamp
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    roundRect(ctx, W / 2 - 240, 140, 480, 72, 36)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px Outfit, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🕊️  KABOOTAR EXPRESS', W / 2, 176)

    // 5. Main Glass Card Container
    const cardX = 100
    const cardY = 280
    const cardW = W - 200
    const cardH = 920

    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 20
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)'
    roundRect(ctx, cardX, cardY, cardW, cardH, 50)
    ctx.fill()
    ctx.restore()

    // Glass stroke
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 3
    roundRect(ctx, cardX, cardY, cardW, cardH, 50)
    ctx.stroke()

    // Occasion Pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    roundRect(ctx, W / 2 - 180, cardY + 70, 360, 64, 32)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px Outfit, sans-serif'
    ctx.fillText((occasionLabel || 'Special Letter').toUpperCase(), W / 2, cardY + 102)

    // "A Letter For"
    ctx.font = '32px Outfit, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.fillText('A SPECIAL LETTER FOR', W / 2, cardY + 230)

    // Recipient Name
    ctx.font = 'bold 84px Outfit, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(to || 'You', W / 2, cardY + 330)

    // Sender line
    if (from) {
      ctx.font = 'italic 36px Outfit, sans-serif'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.fillText(`with all the love from ${from} 💌`, W / 2, cardY + 420)
    }

    // Decorative wax stamp circle in glass card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.beginPath()
    ctx.arc(W / 2, cardY + 620, 110, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = '100px sans-serif'
    ctx.fillText('🕊️', W / 2, cardY + 630)

    ctx.font = 'bold 36px Outfit, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('Sealed with warmth & feelings', W / 2, cardY + 800)

    // 6. QR Code Section (Bottom Tile)
    const qrBoxW = 420
    const qrBoxH = 420
    const qrBoxX = W / 2 - qrBoxW / 2
    const qrBoxY = 1260

    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 15
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 40)
    ctx.fill()
    ctx.restore()

    // Draw QR matrix
    try {
      const matrix = createQRCodeMatrix(url)
      const qrSize = matrix.length
      const padding = 34
      const cellSize = (qrBoxW - padding * 2) / qrSize

      ctx.fillStyle = '#111827'
      for (let r = 0; r < qrSize; r++) {
        for (let c = 0; c < qrSize; c++) {
          if (matrix[r][c]) {
            const px = qrBoxX + padding + c * cellSize
            const py = qrBoxY + padding + r * cellSize
            ctx.fillRect(px, py, cellSize + 0.3, cellSize + 0.3)
          }
        }
      }

      // Little pigeon badge in center of QR
      const centerBoxSize = cellSize * 5
      const centerBoxX = qrBoxX + padding + (qrSize / 2 - 2.5) * cellSize
      const centerBoxY = qrBoxY + padding + (qrSize / 2 - 2.5) * cellSize
      ctx.fillStyle = '#ffffff'
      roundRect(ctx, centerBoxX, centerBoxY, centerBoxSize, centerBoxSize, 8)
      ctx.fill()
      ctx.font = `${Math.round(centerBoxSize * 0.7)}px sans-serif`
      ctx.fillText('🕊️', centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize * 0.55)
    } catch {
      // Fallback text if QR encoding limits exceeded
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText('Open Link To View', qrBoxX + qrBoxW / 2, qrBoxY + qrBoxH / 2)
    }

    // Scan CTA
    ctx.font = 'bold 36px Outfit, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('Scan with camera to open your card ✨', W / 2, 1740)

    // Watermark
    ctx.font = '26px Outfit, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.fillText('zero backend · every feeling lives in the link', W / 2, 1800)

    setReady(true)
  }, [from, occasionLabel, theme, to, url])

  useEffect(() => {
    drawCard()
  }, [drawCard])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setDownloading(true)
    playSparkle()
    triggerHaptic([30, 20, 50])

    const filename = `kabootar-for-${(to || 'you').toLowerCase().replace(/\s+/g, '-')}.png`
    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()

    setTimeout(() => setDownloading(false), 800)
  }

  const handleShare = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    playSparkle()
    triggerHaptic([25])

    if (navigator.share && canvas.toBlob) {
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `kabootar-${to || 'card'}.png`, { type: 'image/png' })
        try {
          await navigator.share({
            title: `A Kabootar for ${to || 'you'} 🕊️`,
            text: `I made this special card for you! Scan or open: ${url}`,
            files: [file],
          })
          return
        } catch {
          // User dismissed or file share unsupported
        }
      })
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative max-w-sm sm:max-w-md w-full bg-[#12121d] rounded-3xl p-5 ring-1 ring-white/15 shadow-2xl flex flex-col items-center"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            aria-label="Close modal"
          >
            ✕
          </button>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📸</span>
            <h3 className="text-lg font-bold text-white">Story Card & QR Code</h3>
          </div>
          <p className="text-xs text-white/50 text-center mb-4">
            Perfect for Instagram Stories, WhatsApp Status, or printing!
          </p>

          {/* Canvas preview (scaled down for preview) */}
          <div className="w-64 sm:w-72 aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 mb-5 relative flex items-center justify-center bg-black/40">
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-xs">
                Rendering Story Card…
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={handleDownload}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 hover:brightness-110 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition"
            >
              <span>{downloading ? '⏳' : '📥'}</span>
              <span>Download Image</span>
            </button>
            <button
              onClick={handleShare}
              className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs uppercase tracking-wider ring-1 ring-white/15 flex items-center justify-center gap-2 transition"
            >
              <span>📲</span>
              <span>Share Story</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.arcTo(x + width, y, x + width, y + radius, radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
  ctx.lineTo(x + radius, y + height)
  ctx.arcTo(x, y + height, x, y + height - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}
