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
  default: () => import('./scenes/DefaultScene'),
}

/** Scenes that put interactive elements near the bottom of the screen. */
const INTERACTIVE_SCENES = new Set(['sorry', 'birthday'])

export default function MobileViewer({ data }) {
  const lines = parseLines(data)
  const [current, setCurrent] = useState(0)
  const reducedMotion = useReducedMotion()
  const transitionsOn = data.animated !== false && !reducedMotion
  const touchStart = useRef(null)

  const occasion = getOccasion(data.occasion)
  const sceneKey = occasion?.scene || 'default'
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
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-20 pointer-events-none">
        <div
          className="h-full bg-white/80 transition-all duration-300"
          style={{ width: `${((current + 1) / totalCards) * 100}%` }}
        />
      </div>

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
  const block = 'text-center text-white bg-black/25 backdrop-blur-sm rounded-2xl px-6 py-6 max-w-md'
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
      </div>
    )
  }
  if (current > 0 && current < totalCards - 1) {
    return (
      <div className={block}>
        <p className="text-xl leading-relaxed whitespace-pre-line px-4" style={{ color: theme.text }}>
          {fillNames(lines[current] || '', data)}
        </p>
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
  const replyText = encodeURIComponent(`Hey ${data.to}! Saw your kabootar 💌 — made by ${data.from}`)
  return (
    <div className="text-center text-white bg-black/25 backdrop-blur-sm rounded-2xl px-6 py-8 max-w-md">
      <p className="text-2xl font-bold mb-6" style={{ color: theme.text }}>💌</p>
      <p className="text-lg mb-6" style={{ color: theme.text }}>Want to send one back?</p>
      <a
        href={`https://wa.me/?text=${replyText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold shadow-lg transition-colors pointer-events-auto"
      >
        Reply via WhatsApp 💬
      </a>
    </div>
  )
}

function parseLines(data) {
  if (data.message) return data.message.split('\n').filter(Boolean)
  return []
}
