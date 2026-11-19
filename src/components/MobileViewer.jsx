import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getOccasion } from '../templates'
import getTheme from '../lib/getTheme'
import { fillNames } from '../lib/fillNames'
import useReducedMotion from '../lib/useReducedMotion'

const SCENES = {
  sorry: () => import('./scenes/SorryScene'),
  birthday: () => import('./scenes/BirthdayScene'),
  romantic: () => import('./scenes/RomanticScene'),
  newyear: () => import('./scenes/NewYearScene'),
  scratch: () => import('./scenes/ScratchScene'),
  roast: () => import('./scenes/RoastScene'),
  chai: () => import('./scenes/ChaiScene'),
  default: () => import('./scenes/DefaultScene'),
}

/** Scenes that put interactive elements near the bottom of the screen. */
const INTERACTIVE_SCENES = new Set(['sorry', 'birthday', 'scratch', 'roast', 'chai'])

export default function MobileViewer({ data }) {
  const lines = parseLines(data)
  const [current, setCurrent] = useState(0)
  const reducedMotion = useReducedMotion()
  const transitionsOn = data.animated !== false && !reducedMotion
  const touchStart = useRef(null)
  const lastTouchTime = useRef(0)

  const occasion = getOccasion(data.occasion)
  const sceneKey = data.scene || occasion?.scene || 'default'
  const theme = getTheme(data)
  const occasionLabel = occasion?.label || data.occasionLabel || ''
  const totalCards = lines.length + 1 // +1 for reply card

  const isReply = current === totalCards - 1
  const sceneHasControls = INTERACTIVE_SCENES.has(sceneKey) && transitionsOn
  const bottomReserved = isReply || sceneHasControls

  const handleTouchStart = (e) => {
    const t = e.touches[0]
    touchStart.current = {
      x: t.clientX,
      y: t.clientY,
      interactive: !!t.target?.closest?.('button, a, [data-interactive]'),
    }
  }
  const handleTouchEnd = (e) => {
    lastTouchTime.current = Date.now()
    const start = touchStart.current
    touchStart.current = null
    if (!start || start.interactive) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y

    // Swipe (works everywhere except controls)
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && current < totalCards - 1) setCurrent((c) => c + 1)
      else if (dx > 0 && current > 0) setCurrent((c) => c - 1)
      return
    }
    // Tap zones (ignore drags and scrolls)
    if (Math.abs(dx) > 12 || Math.abs(dy) > 12) return
    // Never treat the bottom 35% as a tap zone when scene buttons or the
    // WhatsApp reply button live there.
    if (bottomReserved && t.clientY > window.innerHeight * 0.65) return
    if (t.clientX < window.innerWidth / 3) {
      if (current > 0) setCurrent((c) => c - 1)
    } else if (t.clientX > (window.innerWidth * 2) / 3) {
      if (current < totalCards - 1) setCurrent((c) => c + 1)
    }
  }

  const handleClick = (e) => {
    // Avoid double-firing immediately after touch
    if (Date.now() - lastTouchTime.current < 500) return
    if (e.target?.closest?.('button, a, [data-interactive]')) return
    if (bottomReserved && e.clientY > window.innerHeight * 0.65) return
    if (e.clientX < window.innerWidth / 3) {
      if (current > 0) setCurrent((c) => c - 1)
    } else if (e.clientX > (window.innerWidth * 2) / 3) {
      if (current < totalCards - 1) setCurrent((c) => c + 1)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' && current < totalCards - 1) setCurrent((c) => c + 1)
    if (e.key === 'ArrowLeft' && current > 0) setCurrent((c) => c - 1)
  }

  const card = renderCard({ current, lines, data, theme, occasionLabel, totalCards, isReply })

  return (
    <div
      className="relative w-full h-screen overflow-hidden select-none"
      style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Instagram-style segmented story progress bars */}
      <div className="absolute top-2.5 left-3 right-3 flex gap-1.5 z-30 pointer-events-none">
        {Array.from({ length: totalCards }, (_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-black/25 backdrop-blur-sm">
            <div
              className={`h-full transition-all duration-300 ${
                i <= current
                  ? 'bg-gradient-to-r from-pink-400 via-violet-300 to-cyan-300 w-full'
                  : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Subtle navigation arrows */}
      {current > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => c - 1) }}
          aria-label="Previous card"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/25 hover:bg-black/45 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md transition pointer-events-auto text-lg leading-none"
        >
          ‹
        </button>
      )}
      {current < totalCards - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => c + 1) }}
          aria-label="Next card"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/25 hover:bg-black/45 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md transition pointer-events-auto text-lg leading-none"
        >
          ›
        </button>
      )}

      {/* Scene layer: receives no events itself, but interactive elements
          inside scenes re-enable them with pointer-events-auto. */}
      <div className="absolute inset-0 pointer-events-none">
        <DynamicScene sceneKey={sceneKey} data={data} animated={transitionsOn} />
      </div>

      {/* Cards layer: transparent to clicks so scene controls stay reachable. */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-20 pointer-events-none">
        {transitionsOn ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full flex justify-center"
            >
              {card}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div key={current} className="w-full flex justify-center">
            {card}
          </div>
        )}
      </div>
    </div>
  )
}

function renderCard({ current, lines, data, theme, occasionLabel, totalCards, isReply }) {
  const block = 'text-center text-white bg-black/35 backdrop-blur-md rounded-3xl px-6 py-7 ring-1 ring-white/15 shadow-2xl max-w-md'
  if (current === 0) {
    const firstLine = fillNames(lines[0] || '', data)
    // Don't show the receiver's name twice: skip the heading when the first
    // line already contains it.
    const showHeading = !firstLine.includes(data.to || '')
    return (
      <div className={block}>
        {occasionLabel && <p className="text-lg opacity-80 mb-2">{occasionLabel}</p>}
        {showHeading && data.to && (
          <h1 className="text-4xl font-bold mb-4" style={{ color: theme.text }}>{data.to}</h1>
        )}
        <p className="text-xl leading-relaxed whitespace-pre-line px-4" style={{ color: theme.text }}>
          {firstLine}
        </p>
        {data.from && lines.length === 1 && (
          <p className="mt-6 text-white/60 text-sm">— {data.from}</p>
        )}
      </div>
    )
  }
  if (current > 0 && current < totalCards - 1) {
    return (
      <div className={block}>
        <p className="text-xl leading-relaxed whitespace-pre-line px-4" style={{ color: theme.text }}>
          {fillNames(lines[current] || '', data)}
        </p>
        {data.from && current === lines.length - 1 && (
          <p className="mt-6 text-white/60 text-sm">— {data.from}</p>
        )}
      </div>
    )
  }
  if (isReply) return <ReplyCard data={data} theme={theme} />
  return null
}

function DynamicScene({ sceneKey, data, animated }) {
  const [loaded, setLoaded] = useState(null) // { key, Comp }
  useEffect(() => {
    let alive = true
    SCENES[sceneKey]?.()
      .then((m) => { if (alive) setLoaded({ key: sceneKey, Comp: m.default }) })
      .catch(() => null)
    return () => { alive = false }
  }, [sceneKey])
  if (!loaded || loaded.key !== sceneKey) return null
  const { Comp } = loaded
  return <Comp animated={animated} toName={data.to} />
}

function ReplyCard({ data, theme }) {
  const replyText = encodeURIComponent(`Hey ${data.from || 'there'}! Loved your kabootar 💌`)
  return (
    <div className="text-center text-white bg-black/35 backdrop-blur-md rounded-3xl px-6 py-8 ring-1 ring-white/15 shadow-2xl max-w-md">
      <p className="text-2xl font-bold mb-6" style={{ color: theme.text }}>💌</p>
      <p className="text-lg mb-6" style={{ color: theme.text }}>Want to send one back?</p>
      <a
        href={`https://wa.me/?text=${replyText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-400 hover:brightness-110 text-white rounded-full font-bold shadow-lg transition pointer-events-auto"
      >
        Reply via WhatsApp 💬
      </a>
      <p className="mt-4">
        <a
          href="#/"
          className="text-sm text-white/70 hover:text-white underline underline-offset-4 pointer-events-auto transition-colors"
        >
          Make your own 🕊️
        </a>
      </p>
    </div>
  )
}

function parseLines(data) {
  if (data.message) return data.message.split('\n').filter(Boolean)
  return []
}
