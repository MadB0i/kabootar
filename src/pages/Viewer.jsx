import { useState, useEffect, useRef, useMemo } from 'react'
import { decodeData } from '../lib/encode'
import { decryptPayload } from '../lib/crypto'
import { getOccasion } from '../templates'
import getTheme from '../lib/getTheme'
import useMediaQuery from '../lib/useMediaQuery'
import MobileViewer from '../components/MobileViewer'
import DesktopViewer from '../components/DesktopViewer'
import EnvelopeOpening from '../components/EnvelopeOpening'
import { startAmbientBGM, stopAmbientBGM, toggleMute, getMuteState } from '../lib/sound'

function formatCountdown(target) {
  const diff = target - Date.now()
  if (diff <= 0) return null
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  return `${d}d ${h}h ${m}m ${s}s`
}

/** raw = encoded payload string from the hash (App passes it as a prop,
 *  and key={raw} in App remounts us whenever the hash changes). */
export default function Viewer({ data: raw }) {
  const decoded = useMemo(() => decodeData(raw), [raw])
  const [revealed, setRevealed] = useState(null) // decrypted {from,to,message}
  const [secretAnswer, setSecretAnswer] = useState('')
  const [secretError, setSecretError] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const unlockTime = decoded?.unlockAt ? new Date(decoded.unlockAt).getTime() : null
  const locked = !!unlockTime && unlockTime > now

  // Tick the clock while the time lock is active.
  useEffect(() => {
    if (!unlockTime || unlockTime <= Date.now()) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [unlockTime])

  const screen = !decoded
    ? 'broken'
    : locked
      ? 'locked'
      : decoded.secret?.q && !revealed
        ? 'secret'
        : 'viewer'

  const handleSecretSubmit = async () => {
    if (!decoded?.secret || !secretAnswer.trim()) return
    try {
      const result = await decryptPayload(decoded.secret, secretAnswer.trim())
      if (result && typeof result === 'object') {
        setRevealed(result)
        setSecretError('')
      } else {
        setSecretError('❌ Wrong answer. Try again?')
      }
    } catch {
      setSecretError('❌ Wrong answer. Try again?')
    }
  }

  const [envelopeOpened, setEnvelopeOpened] = useState(false)
  const [muted, setMuted] = useState(getMuteState)

  const viewerData = revealed
    ? { ...decoded, from: revealed.from, to: revealed.to, message: revealed.message }
    : decoded
  const theme = getTheme(viewerData)

  const handleOpenEnvelope = () => {
    setEnvelopeOpened(true)
    if (viewerData?.bgm) {
      startAmbientBGM(viewerData.bgm)
    }
  }

  useEffect(() => {
    return () => {
      stopAmbientBGM()
    }
  }, [])

  const handleToggleAudio = () => {
    const next = toggleMute()
    setMuted(next)
  }

  if (screen === 'broken') return <BrokenScreen />
  if (screen === 'locked') {
    const label = getOccasion(decoded?.occasion)?.label
    return <LockedScreen countdown={formatCountdown(unlockTime) || ''} label={label} />
  }
  if (screen === 'secret') {
    return (
      <SecretScreen
        data={decoded}
        answer={secretAnswer}
        onAnswer={setSecretAnswer}
        clearError={() => setSecretError('')}
        onSubmit={handleSecretSubmit}
        error={secretError}
      />
    )
  }

  if (!envelopeOpened) {
    return (
      <EnvelopeOpening
        data={viewerData}
        theme={theme}
        onOpen={handleOpenEnvelope}
      />
    )
  }

  return (
    <div className="relative w-full h-screen">
      {/* Sound / Music Controls */}
      <button
        onClick={handleToggleAudio}
        className="fixed top-3.5 right-3.5 z-40 px-3 py-1.5 rounded-full bg-black/35 hover:bg-black/55 text-white/90 text-xs font-semibold backdrop-blur-md ring-1 ring-white/15 shadow-lg flex items-center gap-1.5 transition pointer-events-auto"
        aria-label={muted ? 'Unmute audio' : 'Mute audio'}
      >
        <span>{muted ? '🔇' : '🔊'}</span>
        <span className="hidden sm:inline">{muted ? 'Muted' : 'Sound On'}</span>
      </button>

      {viewerData.music && <BackgroundMusic src={viewerData.music} />}
      {isDesktop ? <DesktopViewer data={viewerData} /> : <MobileViewer data={viewerData} />}
    </div>
  )
}

function BrokenScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-6xl mb-4">💔</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">This link is broken</h1>
        <p className="text-gray-500 mb-6">The greeting may have expired or the link got corrupted.</p>
        <a href="#/" className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-sm font-medium transition-colors">
          Go back home
        </a>
      </div>
    </div>
  )
}

function LockedScreen({ countdown, label }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900 px-4">
      <div className="text-center text-white">
        <p className="text-5xl mb-4">⏳</p>
        <h1 className="text-2xl font-bold mb-2">{label || 'A special message'} is waiting</h1>
        <p className="text-xl opacity-80 font-mono mb-6">{countdown}</p>
        <p className="text-sm opacity-60">Patience is part of the surprise…</p>
      </div>
    </div>
  )
}

function SecretScreen({ data, answer, onAnswer, onSubmit, clearError, error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 to-orange-900 px-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-sm w-full text-center text-white">
        <p className="text-4xl mb-4">🔐</p>
        <h2 className="text-xl font-bold mb-2">A secret question</h2>
        <p className="text-sm opacity-75 mb-6">{data?.secret?.q || 'What is the answer?'}</p>
        <input
          type="text"
          value={answer}
          onChange={(e) => { onAnswer(e.target.value); clearError() }}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="Your answer…"
          className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-pink-400 mb-2"
        />
        {error && <p className="text-red-300 text-sm mb-4">{error}</p>}
        <button
          onClick={onSubmit}
          className="w-full py-3 bg-pink-500 hover:bg-pink-600 rounded-xl font-bold transition-colors"
        >
          Reveal 💌
        </button>
      </div>
    </div>
  )
}

function BackgroundMusic({ src }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const a = new Audio(src)
    a.loop = true
    audioRef.current = a
    return () => a.pause()
  }, [src])
  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play().then(() => setPlaying(true)).catch(() => setPlaying(false)) }
  }
  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-xl shadow"
      aria-label={playing ? 'Pause music' : 'Play music'}
    >
      {playing ? '🔊' : '🔇'}
    </button>
  )
}
