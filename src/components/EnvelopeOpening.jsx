import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playSealBreak, playPaperRustle, playSparkle, triggerHaptic } from '../lib/sound'

export default function EnvelopeOpening({ data, theme, onOpen }) {
  const [opening, setOpening] = useState(false)

  const handleBreakSeal = () => {
    if (opening) return
    setOpening(true)
    playSealBreak()
    triggerHaptic([40, 30, 60])

    setTimeout(() => {
      playPaperRustle()
    }, 450)

    setTimeout(() => {
      playSparkle()
    }, 900)

    setTimeout(() => {
      onOpen()
    }, 1400)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 select-none overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
    >
      {/* Ambient background particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-white/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-pink-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Skip button */}
      <button
        onClick={onOpen}
        className="absolute top-5 right-5 z-20 px-3.5 py-1.5 rounded-full bg-black/25 hover:bg-black/40 text-white/80 hover:text-white text-xs font-medium backdrop-blur-md transition-all ring-1 ring-white/15"
      >
        Skip ⚡
      </button>

      {/* Header prompt */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 z-10"
      >
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/25 backdrop-blur-md ring-1 ring-white/20 text-white/90 text-xs tracking-wider uppercase mb-3">
          <span>🕊️</span> Kabootar Express
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
          A letter has arrived for you
        </h1>
        {data.to && (
          <p className="text-white/80 text-lg mt-1 font-medium drop-shadow">
            To: <span className="text-yellow-200 font-bold">{data.to}</span>
            {data.from && <span className="text-white/60 text-sm ml-2">from {data.from}</span>}
          </p>
        )}
      </motion.div>

      {/* The Envelope */}
      <div className="relative w-80 sm:w-96 aspect-[1.4/1] perspective-1000 z-10">
        {/* The Letter inside sliding out */}
        <AnimatePresence>
          {opening && (
            <motion.div
              initial={{ y: 0, scale: 0.9, opacity: 0.8 }}
              animate={{ y: -160, scale: 1, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-4 top-2 bottom-4 bg-white/95 rounded-2xl shadow-2xl p-5 flex flex-col justify-center items-center text-center text-gray-800 z-0 ring-1 ring-black/5"
            >
              <span className="text-3xl mb-2">💌</span>
              <p className="text-sm font-semibold uppercase tracking-widest text-pink-500 mb-1">
                {data.occasionLabel || 'Special Message'}
              </p>
              <p className="text-base font-bold line-clamp-2 px-2 text-gray-800">
                {data.message?.split('\n')[0] || 'Unfolding your message…'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Envelope Base Body */}
        <motion.div
          animate={opening ? { y: 40, opacity: 0.6 } : { y: [0, -6, 0] }}
          transition={opening ? { duration: 0.7 } : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-full h-full bg-gradient-to-b from-[#f8f5f0] to-[#ebdcd0] rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-[#dfd0c0] z-10 flex flex-col justify-between"
        >
          {/* Envelope interior pattern */}
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Diagonal folded side flaps */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Left flap triangle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1/2 bg-[#f2e7db] shadow-[inset_-4px_0_12px_rgba(0,0,0,0.06)]"
              style={{ clipPath: 'polygon(0 0, 0 100%, 100% 50%)' }}
            />
            {/* Right flap triangle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#ebdcce] shadow-[inset_4px_0_12px_rgba(0,0,0,0.06)]"
              style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }}
            />
            {/* Bottom flap triangle */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[60%] bg-[#f7ede2] shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
              style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 0)' }}
            />
          </div>

          {/* Top Flap (folds open in 3D) */}
          <motion.div
            initial={false}
            animate={opening ? { rotateX: -180, zIndex: 0 } : { rotateX: 0, zIndex: 20 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute top-0 left-0 right-0 h-1/2 bg-[#fbf8f3] shadow-[0_6px_20px_rgba(0,0,0,0.12)] border-b border-[#dfd0c0]/50"
            style={{
              transformOrigin: 'top center',
              transformStyle: 'preserve-3d',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            }}
          />

          {/* Wax Seal in the center */}
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto">
            <AnimatePresence>
              {!opening && (
                <motion.button
                  onClick={handleBreakSeal}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.4, opacity: 0, filter: 'blur(8px)' }}
                  transition={{ duration: 0.3 }}
                  className="relative group cursor-pointer focus:outline-none"
                  aria-label="Break the wax seal to open letter"
                >
                  {/* Glowing pulsing aura */}
                  <span className="absolute -inset-3 rounded-full bg-amber-400/30 blur-md group-hover:bg-amber-400/50 animate-ping opacity-60" />

                  {/* Wax Seal Badge */}
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#c92a2a] via-[#a61e1e] to-[#670f0f] shadow-[0_8px_20px_rgba(100,10,10,0.6),inset_0_2px_4px_rgba(255,255,255,0.35)] flex flex-col items-center justify-center border-2 border-[#ff8787]/30 ring-4 ring-black/10">
                    <span className="text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform">
                      🕊️
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-200/90 drop-shadow mt-0.5">
                      SEALED
                    </span>
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Tap hint indicator */}
      {!opening && (
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/80 text-sm mt-8 font-medium drop-shadow flex items-center gap-2 z-10"
        >
          <span>✨</span> Tap the wax seal to open <span>✨</span>
        </motion.p>
      )}
    </div>
  )
}
