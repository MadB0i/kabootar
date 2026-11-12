import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { getOccasion } from '../templates'
import getTheme from '../lib/getTheme'
import { fillNames, lineHasTo } from '../lib/fillNames'
import useReducedMotion from '../lib/useReducedMotion'

const SCENES = {
  sorry: () => import('./scenes/SorryScene'),
  birthday: () => import('./scenes/BirthdayScene'),
  romantic: () => import('./scenes/RomanticScene'),
  newyear: () => import('./scenes/NewYearScene'),
  default: () => import('./scenes/DefaultScene'),
}

export default function DesktopViewer({ data }) {
  const lines = parseLines(data)
  const [current, setCurrent] = useState(0)
  const scrollRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const transitionsOn = data.animated !== false && !reducedMotion

  const occasion = getOccasion(data.occasion)
  const sceneKey = occasion?.scene || 'default'
  const theme = getTheme(data)
  const occasionLabel = occasion?.label || data.occasionLabel || ''
  const total = lines.length + 1 // +1 for reply section

  const scrollToCard = useCallback((idx) => {
    const el = scrollRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(idx, total - 1))
    el.scrollTo({ top: clamped * el.clientHeight, behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [total, reducedMotion])

  // Arrow keys / Page keys really scroll the snap container.
  useEffect(() => {
    const onKey = (e) => {
      const el = scrollRef.current
      if (!el) return
      const step = el.clientHeight
      const at = Math.round(el.scrollTop / step)
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        scrollToCard(at + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        scrollToCard(at - 1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        scrollToCard(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        scrollToCard(total - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [scrollToCard, total])

  // Active dot follows the scroll position.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight)
      setCurrent(Math.max(0, Math.min(idx, total - 1)))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [total])

  // The scroll container is transparent to the mouse so scene controls
  // underneath stay clickable; wheel events are forwarded manually.
  useEffect(() => {
    const onWheel = (e) => {
      const el = scrollRef.current
      if (!el || el.contains(e.target)) return
      el.scrollBy({ top: e.deltaY })
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
    >
      {/* ONE scene instance, fixed behind the scroll container */}
      <div className="fixed inset-0 pointer-events-none">
        <DynamicScene sceneKey={sceneKey} data={data} animated={transitionsOn} />
      </div>

      {/* Side dots */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            onClick={() => scrollToCard(i)}
            className={`w-3 h-3 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>

      <div
        ref={scrollRef}
        className="relative z-10 h-screen overflow-y-auto snap-y snap-mandatory pointer-events-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {lines.map((line, i) => {
          const filled = fillNames(line, data)
          const showHeading = i === 0 && !lineHasTo(line, data) && data.to
          return (
            <section
              key={i}
              className="h-screen snap-start flex items-center justify-center px-12"
            >
              <CardBlock transitionsOn={transitionsOn} className="relative max-w-2xl text-center bg-black/25 backdrop-blur-sm rounded-3xl px-10 py-10">
                {i === 0 && occasionLabel && (
                  <p className="text-white/70 text-sm uppercase tracking-widest mb-4">{occasionLabel}</p>
                )}
                {showHeading && (
                  <h2 className="text-white text-5xl font-bold mb-6" style={{ color: theme.text }}>
                    {data.to}
                  </h2>
                )}
                <p className="text-2xl leading-relaxed text-white/90 whitespace-pre-line">{filled}</p>
                {i === lines.length - 1 && (
                  <p className="mt-8 text-white/60 text-sm">— {data.from}</p>
                )}
              </CardBlock>
            </section>
          )
        })}

        {/* Reply section */}
        <section className="h-screen snap-start flex items-center justify-center">
          <CardBlock transitionsOn={transitionsOn} className="text-center bg-black/25 backdrop-blur-sm rounded-3xl px-10 py-10">
            <p className="text-5xl mb-4">💌</p>
            <p className="text-xl text-white/80 mb-6">Want to send one back?</p>
            <a
              href={replyHref(data)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold shadow-lg transition-colors pointer-events-auto"
            >
              Reply via WhatsApp 💬
            </a>
          </CardBlock>
        </section>
      </div>
    </div>
  )
}

/** Fade-up when entering view; plain div when transitions are off. */
function CardBlock({ transitionsOn, className, children }) {
  if (!transitionsOn) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
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

function replyHref(data) {
  const replyText = encodeURIComponent(`Hey ${data.to}! Saw your kabootar 💌 — made by ${data.from}`)
  return `https://wa.me/?text=${replyText}`
}

function parseLines(data) {
  if (data.message) return data.message.split('\n').filter(Boolean)
  return []
}
