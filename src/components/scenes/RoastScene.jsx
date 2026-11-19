import { useState } from 'react'
import { motion } from 'framer-motion'
import Confetti from '../effects/Confetti'
import { playSparkle, playNahiDodge, triggerHaptic } from '../../lib/sound'

export default function RoastScene({ animated, toName }) {
  const [level, setLevel] = useState(1)
  const [celebrate, setCelebrate] = useState(false)

  const titles = [
    'Mildly Sane 🧘',
    'Certified Clown 🤡',
    'Dangerous Chaos 🦖',
    '100% UNHINGED LEGEND 👑',
  ]

  const handleDiagnose = () => {
    triggerHaptic([30, 20, 50])
    playNahiDodge()
    setLevel((l) => {
      const next = (l % 4) + 1
      if (next === 4) {
        setCelebrate(true)
        playSparkle()
      }
      return next
    })
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-end pb-12 sm:pb-16 pointer-events-none">
      {celebrate && animated && <Confetti count={80} />}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto bg-black/40 backdrop-blur-lg rounded-3xl p-4 sm:p-5 ring-1 ring-white/20 shadow-2xl max-w-xs text-center mx-4"
      >
        <p className="text-xs uppercase tracking-widest text-amber-300 font-bold mb-1">
          {toName ? `${toName}'s Chaos Rating` : 'Chaos Meter'}
        </p>

        {/* Meter Gauge */}
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden my-2.5 p-0.5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-300"
            style={{ width: `${level * 25}%` }}
          />
        </div>

        <p className="text-base font-extrabold text-white mb-3 drop-shadow">
          {titles[level - 1]}
        </p>

        <button
          onClick={handleDiagnose}
          data-interactive
          className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 active:scale-95 text-gray-900 font-bold text-xs uppercase tracking-wider shadow-lg transition"
        >
          Diagnose Chaos ⚡
        </button>
      </motion.div>
    </div>
  )
}
