/**
 * Zero-dependency Web Audio synthesizer for Kabootar.
 * 100% offline, zero external audio assets, works on all modern browsers.
 */

let audioCtx = null
let masterGain = null
let isMuted = false
let currentBgmNodes = null

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    audioCtx = new AudioContextClass()
    masterGain = audioCtx.createGain()
    masterGain.gain.value = isMuted ? 0 : 0.7
    masterGain.connect(audioCtx.destination)
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

export function toggleMute() {
  isMuted = !isMuted
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(isMuted ? 0 : 0.7, audioCtx.currentTime)
  }
  return isMuted
}

export function getMuteState() {
  return isMuted
}

/** Haptic feedback wrapper with fallback */
export function triggerHaptic(pattern = [20]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Ignored if user hasn't interacted yet
    }
  }
}

/** Satisfying wax seal crack + paper break */
export function playSealBreak() {
  const ctx = getAudioContext()
  if (!ctx || isMuted) return
  triggerHaptic([40, 30, 60])

  const t = ctx.currentTime

  // 1. Wax crack snap: filtered noise burst
  const bufferSize = ctx.sampleRate * 0.08
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const output = noiseBuffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1
  }
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer

  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.setValueAtTime(1400, t)
  noiseFilter.Q.setValueAtTime(2.5, t)

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.8, t)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)

  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(masterGain)
  noise.start(t)

  // 2. Resonant pop
  const osc = ctx.createOscillator()
  const oscGain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(440, t)
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.18)

  oscGain.gain.setValueAtTime(0.5, t)
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)

  osc.connect(oscGain)
  oscGain.connect(masterGain)
  osc.start(t)
  osc.stop(t + 0.19)
}

/** Soft parchment / paper slide sound */
export function playPaperRustle() {
  const ctx = getAudioContext()
  if (!ctx || isMuted) return
  const t = ctx.currentTime
  const dur = 0.22

  const bufferSize = ctx.sampleRate * dur
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const out = noiseBuffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    out[i] = Math.random() * 2 - 1
  }

  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(900, t)
  filter.frequency.linearRampToValueAtTime(1600, t + dur)
  filter.Q.value = 1.8

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.01, t)
  gain.gain.linearRampToValueAtTime(0.2, t + dur * 0.4)
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)
  noise.start(t)
}

/** Magical sparkle / chime arpeggio (for confetti, reveals, and stars) */
export function playSparkle() {
  const ctx = getAudioContext()
  if (!ctx || isMuted) return
  triggerHaptic([20, 20, 20])
  const t = ctx.currentTime
  // Pentatonic scale arpeggio notes (Hz)
  const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51]

  notes.forEach((freq, idx) => {
    const noteTime = t + idx * 0.05
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, noteTime)

    gain.gain.setValueAtTime(0.001, noteTime)
    gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45)

    osc.connect(gain)
    gain.connect(masterGain)
    osc.start(noteTime)
    osc.stop(noteTime + 0.46)
  })
}

/** Funny cartoon boing for runaway buttons */
export function playNahiDodge() {
  const ctx = getAudioContext()
  if (!ctx || isMuted) return
  triggerHaptic([15, 30])
  const t = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(220, t)
  osc.frequency.exponentialRampToValueAtTime(620, t + 0.16)

  gain.gain.setValueAtTime(0.35, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)

  osc.connect(gain)
  gain.connect(masterGain)
  osc.start(t)
  osc.stop(t + 0.21)
}

/** Gentle breath whoosh + extinguish sound for birthday candle */
export function playCandleBlow() {
  const ctx = getAudioContext()
  if (!ctx || isMuted) return
  triggerHaptic([30, 20, 50])
  const t = ctx.currentTime
  const dur = 0.4

  // Noise whoosh
  const bufferSize = ctx.sampleRate * dur
  const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const out = buf.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) out[i] = Math.random() * 2 - 1

  const noise = ctx.createBufferSource()
  noise.buffer = buf

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(400, t)
  filter.frequency.linearRampToValueAtTime(1200, t + dur * 0.5)
  filter.frequency.linearRampToValueAtTime(200, t + dur)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.05, t)
  gain.gain.linearRampToValueAtTime(0.4, t + dur * 0.3)
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)
  noise.start(t)
}

/** Firework launch whistle + explosive pop */
export function playFirework() {
  const ctx = getAudioContext()
  if (!ctx || isMuted) return
  triggerHaptic([35])
  const t = ctx.currentTime

  // Whistle rise
  const whistle = ctx.createOscillator()
  const whistleGain = ctx.createGain()
  whistle.type = 'sine'
  whistle.frequency.setValueAtTime(450, t)
  whistle.frequency.exponentialRampToValueAtTime(1100, t + 0.14)
  whistleGain.gain.setValueAtTime(0.12, t)
  whistleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
  whistle.connect(whistleGain)
  whistleGain.connect(masterGain)
  whistle.start(t)
  whistle.stop(t + 0.15)

  // Boom thump at 0.14s
  const boomTime = t + 0.14
  const boom = ctx.createOscillator()
  const boomGain = ctx.createGain()
  boom.type = 'sine'
  boom.frequency.setValueAtTime(120, boomTime)
  boom.frequency.exponentialRampToValueAtTime(35, boomTime + 0.28)
  boomGain.gain.setValueAtTime(0.6, boomTime)
  boomGain.gain.exponentialRampToValueAtTime(0.001, boomTime + 0.3)
  boom.connect(boomGain)
  boomGain.connect(masterGain)
  boom.start(boomTime)
  boom.stop(boomTime + 0.31)

  // Crackle noise
  const bufSize = ctx.sampleRate * 0.2
  const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const d = noiseBuf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1
  const crackle = ctx.createBufferSource()
  crackle.buffer = noiseBuf
  const cFilt = ctx.createBiquadFilter()
  cFilt.type = 'bandpass'
  cFilt.frequency.setValueAtTime(2200, boomTime)
  cFilt.Q.value = 3
  const cGain = ctx.createGain()
  cGain.gain.setValueAtTime(0.2, boomTime)
  cGain.gain.exponentialRampToValueAtTime(0.001, boomTime + 0.22)
  crackle.connect(cFilt)
  cFilt.connect(cGain)
  cGain.connect(masterGain)
  crackle.start(boomTime)
}

/** Tactile coin scratch sound */
export function playScratch() {
  const ctx = getAudioContext()
  if (!ctx || isMuted) return
  triggerHaptic([10])
  const t = ctx.currentTime
  const dur = 0.06

  const bufSize = Math.floor(ctx.sampleRate * dur)
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6

  const noise = ctx.createBufferSource()
  noise.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(1800 + Math.random() * 600, t)
  filter.Q.value = 1.5

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.25, t)
  gain.gain.exponentialRampToValueAtTime(0.01, t + dur)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)
  noise.start(t)
}

/** Cute bubbly heart pop */
export function playHeartPop() {
  const ctx = getAudioContext()
  if (!ctx || isMuted) return
  triggerHaptic([15])
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(350 + Math.random() * 150, t)
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.12)
  gain.gain.setValueAtTime(0.25, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
  osc.connect(gain)
  gain.connect(masterGain)
  osc.start(t)
  osc.stop(t + 0.15)
}

/**
 * Aesthetic Generative Ambient BGM running in pure Web Audio.
 * Types: 'lofi' | 'celestial' | 'rain'
 */
export function startAmbientBGM(type = 'lofi') {
  stopAmbientBGM()
  const ctx = getAudioContext()
  if (!ctx) return

  const bgmGain = ctx.createGain()
  bgmGain.gain.value = 0.18
  bgmGain.connect(masterGain)

  let active = true
  let timers = []

  if (type === 'lofi') {
    // Warm soothing chord progression: Cmaj9 -> Am9 -> Fmaj7 -> G7sus
    const chords = [
      [130.81, 196.00, 246.94, 293.66, 329.63], // C3, G3, B3, D4, E4
      [110.00, 164.81, 196.00, 261.63, 329.63], // A2, E3, G3, C4, E4
      [87.31, 130.81, 164.81, 220.00, 261.63],  // F2, C3, E3, A3, C4
      [98.00, 146.83, 174.61, 261.63, 293.66],  // G2, D3, F3, C4, D4
    ]
    let chordIdx = 0

    const playNextChord = () => {
      if (!active) return
      const chord = chords[chordIdx]
      chordIdx = (chordIdx + 1) % chords.length
      const now = ctx.currentTime

      chord.forEach((freq) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq

        // Soft envelope (gentle Rhodes-style swell)
        g.gain.setValueAtTime(0.001, now)
        g.gain.linearRampToValueAtTime(0.045, now + 0.8)
        g.gain.exponentialRampToValueAtTime(0.001, now + 3.8)

        osc.connect(g)
        g.connect(bgmGain)
        osc.start(now)
        osc.stop(now + 3.9)
      })

      const timer = setTimeout(playNextChord, 3800)
      timers.push(timer)
    }
    playNextChord()
  } else if (type === 'celestial') {
    // Sparkling music box arpeggios
    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51]
    const playBell = () => {
      if (!active) return
      const now = ctx.currentTime
      const freq = scale[Math.floor(Math.random() * scale.length)]

      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq

      g.gain.setValueAtTime(0.001, now)
      g.gain.linearRampToValueAtTime(0.06, now + 0.015)
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.2)

      osc.connect(g)
      g.connect(bgmGain)
      osc.start(now)
      osc.stop(now + 1.25)

      const delay = 350 + Math.random() * 450
      const timer = setTimeout(playBell, delay)
      timers.push(timer)
    }
    playBell()
  } else if (type === 'rain') {
    // Calming pink-noise rain wash
    const bufferSize = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.03
      b6 = white * 0.115926
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    noise.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1100
    noise.connect(filter)
    filter.connect(bgmGain)
    noise.start()
    timers.push({ stop: () => { try { noise.stop() } catch {} } })
  }

  currentBgmNodes = {
    stop: () => {
      active = false
      timers.forEach((t) => {
        if (typeof t === 'number') clearTimeout(t)
        else if (t?.stop) t.stop()
      })
      try {
        bgmGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        setTimeout(() => bgmGain.disconnect(), 600)
      } catch {}
    },
  }
}

export function stopAmbientBGM() {
  if (currentBgmNodes) {
    currentBgmNodes.stop()
    currentBgmNodes = null
  }
}
