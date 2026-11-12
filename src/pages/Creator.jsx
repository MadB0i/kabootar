import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { encodeData } from '../lib/encode'
import { encryptPayload } from '../lib/crypto'
import { occasions } from '../templates'
import { fillNames } from '../lib/fillNames'
import Confetti from '../components/effects/Confetti'

const inputCls = 'w-full px-4 py-3 rounded-2xl bg-white/5 ring-1 ring-white/10 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-pink-400/70 transition'
const labelCls = 'block text-sm font-medium text-white/70 mb-2'

function defaultMessagesFor(o) {
  if (!o) return ''
  const asOneBlock = o.messagesAs === 'as'
    || (Array.isArray(o.messagesAs) && o.messagesAs.includes('as'))
  return (asOneBlock ? o.defaultMessages[0] : o.defaultMessages?.join('\n')) || ''
}

export default function Creator() {
  const [occasion, setOccasion] = useState('sorry')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [message, setMessage] = useState(() => defaultMessagesFor(occasions.find((o) => o.id === 'sorry')))
  const [theme, setTheme] = useState(0)
  const [animated, setAnimated] = useState(true)
  const [music, setMusic] = useState('')
  const [unlockAt, setUnlockAt] = useState('')
  const [secretEnabled, setSecretEnabled] = useState(false)
  const [secretQ, setSecretQ] = useState('')
  const [secretA, setSecretA] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState(null) // { id, msg }
  const [confettiOn, setConfettiOn] = useState(false)
  const toastTimer = useRef(null)
  const confettiTimer = useRef(null)
  const toastId = useRef(0)

  const occasionData = occasions.find((o) => o.id === occasion) || occasions[0]
  const themeColors = occasionData?.themes || []
  const currentTheme = themeColors[theme]?.name || ''
  const activeTheme = themeColors[theme] || { from: '#667eea', to: '#764ba2', text: '#fff' }

  // Reset the message + theme when the occasion changes (render-phase state
  // adjustment, so the textarea never shows the previous occasion's text).
  const [lastOccasionId, setLastOccasionId] = useState(occasion)
  if (lastOccasionId !== occasion) {
    setLastOccasionId(occasion)
    setMessage(defaultMessagesFor(occasionData))
    setTheme(0)
  }

  const showToast = (msg) => {
    clearTimeout(toastTimer.current)
    toastId.current += 1
    setToast({ id: toastId.current, msg })
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }

  const burstConfetti = () => {
    clearTimeout(confettiTimer.current)
    setConfettiOn(true)
    confettiTimer.current = setTimeout(() => setConfettiOn(false), 1800)
  }

  const generateLink = async () => {
    if (!from.trim() || !to.trim()) {
      showToast('Fill both names first ✍️')
      return
    }
    if (secretEnabled && secretQ.trim() && secretA.trim()) {
      // Secret link: {from,to,message} live only inside the AES-GCM ciphertext.
      try {
        const secret = await encryptPayload(
          { from: from.trim(), to: to.trim(), message: message.trim() },
          secretQ.trim(),
          secretA.trim(),
        )
        const obj = {
          v: 1,
          occasion: occasionData?.id,
          theme: currentTheme,
          animated,
          secret,
        }
        if (unlockAt) obj.unlockAt = new Date(unlockAt).toISOString()
        if (music.trim()) obj.music = music.trim()
        const encoded = encodeData(obj)
        const url = `${window.location.origin}${window.location.pathname}#/v/${encoded}`
        setGeneratedLink(url)
        setCopied(false)
        showToast('Secret link ready — the answer unlocks it 🔐')
        return
      } catch {
        showToast('Encryption failed — does your browser support WebCrypto?')
        return
      }
    }
    const obj = {
      v: 1,
      occasion: occasionData?.id,
      occasionLabel: occasionData?.label,
      from: from.trim(),
      to: to.trim(),
      message: message.trim(),
      theme: currentTheme,
      animated,
    }
    if (music.trim()) obj.music = music.trim()
    if (unlockAt) obj.unlockAt = new Date(unlockAt).toISOString()
    const encoded = encodeData(obj)
    const url = `${window.location.origin}${window.location.pathname}#/v/${encoded}`
    setGeneratedLink(url)
    setCopied(false)
    showToast('Link ready — make someone\u2019s day 🕊️')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      burstConfetti()
      showToast('Copied! Now send it 💛')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Copy failed — select the link manually')
    }
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'A little something for you 🕊️', text: 'I made this for you — open it ❤️', url: generatedLink })
        showToast('Shared 🕊️')
        return
      } catch {
        return // user dismissed the share sheet
      }
    }
    await copyLink()
  }

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generatedLink)}`, '_blank')
  }

  const preview = () => {
    if (!generatedLink) { showToast('Generate a link first!'); return }
    window.open(generatedLink, '_blank')
  }

  // Live mini-preview mirrors the viewer's card 0 (including name dedup).
  const previewLine = fillNames(message.split('\n')[0] || '', {
    to: to.trim() || 'them',
    from: from.trim() || 'a friend',
  })
  const previewShowsHeading = !(previewLine && previewLine.includes(to.trim())) && !!to.trim()

  return (
    <div className="min-h-screen bg-[#0b0b12] text-white relative overflow-x-hidden">
      {/* Aurora background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="aurora-blob" style={{ width: '40rem', height: '40rem', left: '-14rem', top: '-16rem', background: 'radial-gradient(circle at 35% 35%, rgba(244,114,182,.4), transparent 62%)', animation: 'aurora-a 18s ease-in-out infinite' }} />
        <div className="aurora-blob" style={{ width: '36rem', height: '36rem', right: '-12rem', top: '20%', background: 'radial-gradient(circle at 40% 40%, rgba(167,139,250,.35), transparent 62%)', animation: 'aurora-b 22s ease-in-out infinite' }} />
        <div className="aurora-blob" style={{ width: '34rem', height: '34rem', left: '20%', bottom: '-16rem', background: 'radial-gradient(circle at 45% 45%, rgba(34,211,238,.28), transparent 62%)', animation: 'aurora-c 26s ease-in-out infinite' }} />
      </div>

      {confettiOn && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <Confetti count={90} />
        </div>
      )}

      <div className="relative max-w-2xl mx-auto px-4 pb-16">
        {/* Nav */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 via-violet-500 to-cyan-400 p-[2px] shadow-lg shadow-pink-500/20">
              <div className="w-full h-full rounded-[14px] bg-[#0b0b12] flex items-center justify-center text-lg">🕊️</div>
            </div>
            <span className="text-lg font-bold tracking-tight">Kabootar</span>
          </div>
          <span className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10 text-white/60">zero backend · links carry everything</span>
        </header>

        {/* Hero */}
        <section className="text-center pt-6 pb-10">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Send a <span className="gradient-text">feeling</span>,<br />not just a text.
          </h1>
          <p className="text-white/55 mt-4 max-w-md mx-auto">
            Animated greeting cards for every occasion — living inside one link.
            No app, no signup, no server.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6 text-xs text-white/50">
            {['1 · Pick an occasion', '2 · Make it yours', '3 · Share the link'].map((s) => (
              <span key={s} className="px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10">{s}</span>
            ))}
          </div>
        </section>

        {/* Creator card */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-3xl bg-white/[.06] ring-1 ring-white/10 backdrop-blur-xl p-5 sm:p-8 shadow-2xl space-y-7"
        >
          {/* Occasion */}
          <div>
            <label className={labelCls}>Pick an occasion</label>
            <div className="flex flex-wrap gap-2">
              {occasions.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOccasion(o.id)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ring-1 ${
                    occasion === o.id
                      ? 'bg-white text-gray-900 ring-white scale-105 shadow-lg shadow-pink-500/20'
                      : 'bg-white/5 text-white/80 ring-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="mr-1.5">{o.emoji}</span>{o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>From 📝</label>
              <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Your name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>To 💌</label>
              <input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Their name" className={inputCls} />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className={labelCls}>Message ✍️ <span className="text-white/35 font-normal">· {'{to}'} and {'{from}'} get replaced with the names</span></label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Write your heartfelt message…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Theme */}
          <div>
            <label className={labelCls}>Theme colors</label>
            <div className="flex flex-wrap gap-2.5">
              {themeColors.map((t, i) => (
                <button
                  key={t.name}
                  onClick={() => setTheme(i)}
                  aria-label={t.name}
                  title={t.name}
                  className={`w-11 h-11 rounded-full ring-2 transition-all ${
                    theme === i ? 'ring-white scale-110 shadow-lg' : 'ring-white/10 hover:scale-105'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                />
              ))}
            </div>
            {currentTheme && <p className="text-xs text-white/40 mt-2">Selected: {currentTheme}</p>}
          </div>

          {/* Live preview */}
          <div>
            <label className={labelCls}>Live preview 👀</label>
            <div className="rounded-2xl overflow-hidden ring-1 ring-white/10">
              <div
                className="h-40 flex flex-col items-center justify-center px-6 text-center"
                style={{ background: `linear-gradient(135deg, ${activeTheme.from}, ${activeTheme.to})` }}
              >
                <p className="text-[11px] uppercase tracking-[.25em] opacity-80" style={{ color: activeTheme.text }}>
                  {occasionData?.label}
                </p>
                {previewShowsHeading && (
                  <p className="text-3xl font-bold mt-1" style={{ color: activeTheme.text }}>{to.trim()}</p>
                )}
                <p className="text-base mt-1.5 line-clamp-2" style={{ color: activeTheme.text }}>
                  {previewLine || 'Your message…'}
                </p>
              </div>
              <p className="text-[11px] text-white/40 px-3 py-2 bg-black/25">This is the first thing they'll see</p>
            </div>
          </div>

          {/* Animated toggle */}
          <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3.5 ring-1 ring-white/10">
            <span className="text-white/80">✨ Animations</span>
            <button
              onClick={() => setAnimated(!animated)}
              aria-label="Toggle animations"
              role="switch"
              aria-checked={animated}
              className={`w-12 h-6.5 py-0 rounded-full transition-colors relative ${animated ? 'bg-gradient-to-r from-pink-500 to-violet-500' : 'bg-white/15'}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${animated ? 'translate-x-6.5' : 'translate-x-1'} top-1/2 -translate-y-1/2 absolute`} />
            </button>
          </div>

          {/* Music */}
          <div>
            <label className={labelCls}>🎵 Music URL (optional)</label>
            <input type="url" value={music} onChange={(e) => setMusic(e.target.value)} placeholder="https://example.com/song.mp3" className={inputCls} />
          </div>

          {/* Unlock at */}
          <div>
            <label className={labelCls}>⏰ Unlock date/time (optional)</label>
            <input type="datetime-local" value={unlockAt} onChange={(e) => setUnlockAt(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
            <p className="text-xs text-white/35 mt-1.5">Soft lock only — not security.</p>
          </div>

          {/* Secret question */}
          <div className="bg-white/5 rounded-2xl ring-1 ring-white/10 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white/80">🔒 Secret question (optional)</span>
              <button
                onClick={() => setSecretEnabled(!secretEnabled)}
                aria-label="Toggle secret question"
                role="switch"
                aria-checked={secretEnabled}
                className={`w-12 h-6 rounded-full transition-colors relative ${secretEnabled ? 'bg-gradient-to-r from-pink-500 to-violet-500' : 'bg-white/15'}`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${secretEnabled ? 'translate-x-6' : 'translate-x-1'} top-1/2 -translate-y-1/2 absolute`} />
              </button>
            </div>
            {secretEnabled && (
              <div className="space-y-2 mt-3">
                <input
                  type="text"
                  value={secretQ}
                  onChange={(e) => setSecretQ(e.target.value)}
                  placeholder="Question? (e.g. What's my pet's name?)"
                  className={`${inputCls} text-sm`}
                />
                <input
                  type="text"
                  value={secretA}
                  onChange={(e) => setSecretA(e.target.value)}
                  placeholder="Answer"
                  className={`${inputCls} text-sm`}
                />
              </div>
            )}
          </div>

          {/* Generate */}
          <button
            onClick={generateLink}
            className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400 hover:brightness-110 active:scale-[.99] transition shadow-lg shadow-pink-500/25"
          >
            🚀 Generate the link
          </button>

          {/* Result */}
          <AnimatePresence>
            {generatedLink && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-4 space-y-3"
              >
                <p className="text-xs text-white/50 font-medium">Your shareable link</p>
                <p className="text-xs break-all text-white/80 bg-white/5 rounded-xl px-3 py-2.5 font-mono">{generatedLink}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={copyLink}
                    className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold transition"
                  >
                    {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
                  <button
                    onClick={shareLink}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-pink-500/80 to-violet-500/80 hover:brightness-110 text-sm font-semibold transition"
                  >
                    📤 Share
                  </button>
                  <button
                    onClick={shareWhatsApp}
                    className="py-2.5 rounded-xl bg-green-500/90 hover:bg-green-500 text-sm font-semibold transition"
                  >
                    💬 WhatsApp
                  </button>
                  <button
                    onClick={preview}
                    className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold transition"
                  >
                    👁️ Preview
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Feature trio */}
        <section className="grid sm:grid-cols-3 gap-3 mt-10">
          {[
            { icon: '🔐', title: 'Encrypted secrets', text: 'PBKDF2 + AES-GCM in your browser — only the right answer opens the card.' },
            { icon: '⚡', title: 'Zero backend', text: 'No server, no database, no tracking. The link is the message.' },
            { icon: '🎬', title: 'Interactive scenes', text: 'Runaway buttons, blowable candles, star-formed names.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-white/[.04] ring-1 ring-white/10 p-4">
              <p className="text-xl">{f.icon}</p>
              <p className="font-semibold text-sm mt-1.5">{f.title}</p>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-white/35 mt-12">
          Made with 🕊️ — every message lives in the link alone.{' '}
          <a href="https://github.com/madb0i/kabootar" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-white/60">GitHub</a>
        </footer>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-white text-gray-900 text-sm font-semibold shadow-2xl"
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
