import { useState } from 'react'
import { encodeData } from '../lib/encode'
import { encryptPayload } from '../lib/crypto'
import { occasions } from '../templates'

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

  const occasionData = occasions.find((o) => o.id === occasion) || occasions[0]
  const themeColors = occasionData?.themes || []
  const currentTheme = themeColors[theme]?.name || ''

  // Reset the message + theme when the occasion changes (render-phase state
  // adjustment, so the textarea never shows the previous occasion's text).
  const [lastOccasionId, setLastOccasionId] = useState(occasion)
  if (lastOccasionId !== occasion) {
    setLastOccasionId(occasion)
    setMessage(defaultMessagesFor(occasionData))
    setTheme(0)
  }

  const generateLink = async () => {
    if (!from.trim() || !to.trim()) {
      alert('Please fill in both names.')
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
        return
      } catch {
        alert('Could not encrypt the secret — check your browser supports WebCrypto.')
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
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generatedLink)}`, '_blank')
  }

  const preview = () => {
    if (!generatedLink) { alert('Generate a link first!'); return }
    window.open(generatedLink, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4">
        <h1 className="text-2xl font-bold text-pink-500 text-center">🕊️ Kabootar</h1>
        <p className="text-center text-gray-500 text-sm mt-1">Create a greeting link — no account needed</p>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Occasion picker */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Pick an occasion</label>
          <div className="grid grid-cols-3 gap-2">
            {occasions.map((o) => (
              <button
                key={o.id}
                onClick={() => setOccasion(o.id)}
                className={`px-3 py-3 rounded-xl text-center transition-all ${
                  occasion === o.id
                    ? 'bg-pink-500 text-white shadow-md scale-105'
                    : 'bg-white text-gray-700 hover:bg-pink-50 border border-gray-200'
                }`}
              >
                <span className="text-2xl block">{o.emoji}</span>
                <span className="text-xs font-medium mt-1 block">{o.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Names */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">From 📝</label>
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">To 💌</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Receiver's name"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none"
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Message ✍️</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Write your heartfelt message…"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none resize-none"
          />
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Theme colors</label>
          <div className="flex flex-wrap gap-2">
            {themeColors.map((t, i) => (
              <button
                key={t.name}
                onClick={() => setTheme(i)}
                aria-label={t.name}
                className={`relative w-12 h-12 rounded-full shadow-inner border-2 transition-all ${
                  theme === i ? 'border-pink-500 scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                title={t.name}
              />
            ))}
          </div>
          {currentTheme && (
            <p className="text-xs text-gray-500 mt-2">Selected: {currentTheme}</p>
          )}
        </div>

        {/* Animated toggle */}
        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-200">
          <span className="text-gray-700">✨ Animations</span>
          <button
            onClick={() => setAnimated(!animated)}
            aria-label="Toggle animations"
            role="switch"
            aria-checked={animated}
            className={`w-12 h-6 rounded-full transition-colors ${animated ? 'bg-pink-500' : 'bg-gray-300'}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${animated ? 'translate-x-6' : 'translate-x-1'} mt-0.5`} />
          </button>
        </div>

        {/* Music URL */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">🎵 Music URL (optional)</label>
          <input
            type="url"
            value={music}
            onChange={(e) => setMusic(e.target.value)}
            placeholder="https://example.com/song.mp3"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-400 outline-none"
          />
        </div>

        {/* Unlock at */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">⏰ Unlock date/time (optional)</label>
          <input
            type="datetime-local"
            value={unlockAt}
            onChange={(e) => setUnlockAt(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-400 outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">Soft lock only — not security.</p>
        </div>

        {/* Secret question */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-gray-700">🔒 Secret question (optional)</span>
            <button
              onClick={() => setSecretEnabled(!secretEnabled)}
              aria-label="Toggle secret question"
              role="switch"
              aria-checked={secretEnabled}
              className={`w-10 h-5 rounded-full transition-colors ${secretEnabled ? 'bg-pink-500' : 'bg-gray-300'}`}
            >
              <span className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform ${secretEnabled ? 'translate-x-5' : 'translate-x-1'} mt-0.5`} />
            </button>
          </div>
          {secretEnabled && (
            <div className="space-y-2">
              <input
                type="text"
                value={secretQ}
                onChange={(e) => setSecretQ(e.target.value)}
                placeholder="Question? (e.g. What's my pet's name?)"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-400 outline-none text-sm"
              />
              <input
                type="text"
                value={secretA}
                onChange={(e) => setSecretA(e.target.value)}
                placeholder="Answer"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-400 outline-none text-sm"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={generateLink}
            className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl shadow-md transition-colors"
          >
            🚀 Generate Link
          </button>
          {generatedLink && (
            <>
              <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-2">
                <p className="text-xs text-gray-500 font-medium">Your shareable link:</p>
                <p className="text-xs break-all text-gray-700 bg-gray-50 rounded px-3 py-2">{generatedLink}</p>
                <div className="flex gap-2">
                  <button
                    onClick={copyLink}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
                  <button
                    onClick={shareWhatsApp}
                    className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    💬 WhatsApp
                  </button>
                  <button
                    onClick={preview}
                    className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    👁️ Preview
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        Your message lives only inside the link. No server, no tracking.
      </footer>
    </div>
  )
}
