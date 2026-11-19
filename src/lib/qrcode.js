/**
 * Lightweight, zero-dependency QR Code generator (Version 1-10, Byte mode, ECC M).
 * Produces a 2D boolean matrix for canvas rendering.
 */

// Galois Field GF(256) tables
const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x
  EXP[i + 255] = x
  LOG[x] = i
  x = (x << 1) ^ (x >= 128 ? 0x11d : 0)
}
function gMul(a, b) {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]
}

function polyMul(p, q) {
  const r = new Uint8Array(p.length + q.length - 1)
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < q.length; j++) {
      r[i + j] ^= gMul(p[i], q[j])
    }
  }
  return r
}

function genPoly(deg) {
  let p = new Uint8Array([1])
  for (let i = 0; i < deg; i++) {
    p = polyMul(p, new Uint8Array([1, EXP[i]]))
  }
  return p
}

function calcEcc(data, eccLen) {
  const gen = genPoly(eccLen)
  const padded = new Uint8Array(data.length + eccLen)
  padded.set(data)
  for (let i = 0; i < data.length; i++) {
    const coef = padded[i]
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        padded[i + j] ^= gMul(gen[j], coef)
      }
    }
  }
  return padded.slice(data.length)
}

// Table of capacities for Byte mode with ECC Level M (Version 1 to 10)
const VERSIONS = [
  null,
  { size: 21, dataBytes: 16, eccBytes: 10, align: [] },
  { size: 25, dataBytes: 28, eccBytes: 16, align: [6, 18] },
  { size: 29, dataBytes: 44, eccBytes: 26, align: [6, 22] },
  { size: 33, dataBytes: 64, eccBytes: 36, align: [6, 26] },
  { size: 37, dataBytes: 86, eccBytes: 48, align: [6, 30] },
  { size: 41, dataBytes: 108, eccBytes: 64, align: [6, 34] },
  { size: 45, dataBytes: 124, eccBytes: 72, align: [6, 22, 38] },
  { size: 49, dataBytes: 154, eccBytes: 88, align: [6, 24, 42] },
  { size: 53, dataBytes: 182, eccBytes: 110, align: [6, 26, 46] },
  { size: 57, dataBytes: 216, eccBytes: 130, align: [6, 28, 50] },
  { size: 61, dataBytes: 254, eccBytes: 150, align: [6, 30, 54] },
  { size: 65, dataBytes: 290, eccBytes: 176, align: [6, 32, 58] },
  { size: 69, dataBytes: 334, eccBytes: 198, align: [6, 34, 62] },
  { size: 73, dataBytes: 365, eccBytes: 216, align: [6, 26, 46, 66] },
]

export function createQRCodeMatrix(text) {
  const enc = new TextEncoder()
  const rawBytes = enc.encode(text)

  let ver = 1
  while (ver < VERSIONS.length && VERSIONS[ver].dataBytes < rawBytes.length + 3) {
    ver++
  }
  if (ver >= VERSIONS.length) {
    // If payload is unusually long, use truncated/fallback version
    ver = VERSIONS.length - 1
  }

  const vInfo = VERSIONS[ver]
  const size = vInfo.size
  const matrix = Array.from({ length: size }, () => Array(size).fill(false))
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false))

  // 1. Finder patterns
  function addFinder(r0, c0) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6
        const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4
        matrix[r0 + r][c0 + c] = isBorder || isCore
        isFunction[r0 + r][c0 + c] = true
      }
    }
    // Separator
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const r1 = r0 + r
        const c1 = c0 + c
        if (r1 >= 0 && r1 < size && c1 >= 0 && c1 < size) {
          isFunction[r1][c1] = true
        }
      }
    }
  }

  addFinder(0, 0)
  addFinder(0, size - 7)
  addFinder(size - 7, 0)

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0
    isFunction[6][i] = true
    matrix[i][6] = i % 2 === 0
    isFunction[i][6] = true
  }

  // 3. Alignment patterns (version >= 2)
  if (vInfo.align.length > 0) {
    const coords = vInfo.align
    for (const r of coords) {
      for (const c of coords) {
        if (isFunction[r][c]) continue
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2
            const isCenter = dr === 0 && dc === 0
            matrix[r + dr][c + dc] = isBorder || isCenter
            isFunction[r + dr][c + dc] = true
          }
        }
      }
    }
  }

  // Reserve format bits
  for (let i = 0; i < 9; i++) {
    if (i < size) isFunction[8][i] = true
    if (i < size) isFunction[i][8] = true
  }
  for (let i = size - 8; i < size; i++) {
    if (i >= 0) isFunction[8][i] = true
    if (i >= 0) isFunction[i][8] = true
  }
  // Dark module
  matrix[size - 8][8] = true
  isFunction[size - 8][8] = true

  // 4. Encode data stream
  const bits = []
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1)
    }
  }
  // Mode: byte (0100)
  pushBits(4, 4)
  // Count
  const lenBits = ver <= 9 ? 8 : 16
  pushBits(Math.min(rawBytes.length, vInfo.dataBytes), lenBits)
  for (let i = 0; i < Math.min(rawBytes.length, vInfo.dataBytes); i++) {
    pushBits(rawBytes[i], 8)
  }
  // Terminator
  pushBits(0, Math.min(4, vInfo.dataBytes * 8 - bits.length))
  // Align to byte
  while (bits.length % 8 !== 0) bits.push(0)
  // Pad bytes 0xEC, 0x11
  const pads = [0xec, 0x11]
  let padIdx = 0
  while (bits.length < vInfo.dataBytes * 8) {
    pushBits(pads[padIdx], 8)
    padIdx = (padIdx + 1) % 2
  }

  // Convert to byte array
  const dataBytes = new Uint8Array(vInfo.dataBytes)
  for (let i = 0; i < dataBytes.length; i++) {
    let byte = 0
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i * 8 + b]
    }
    dataBytes[i] = byte
  }

  // 5. Error correction
  const ecc = calcEcc(dataBytes, vInfo.eccBytes)
  const fullCodewords = new Uint8Array(dataBytes.length + ecc.length)
  fullCodewords.set(dataBytes)
  fullCodewords.set(ecc, dataBytes.length)

  // 6. Placement in matrix with Mask 0 ((row + col) % 2 === 0)
  let bitIndex = 0
  const totalBits = fullCodewords.length * 8
  let upward = true

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right-- // Skip vertical timing column
    const colList = [right, right - 1]
    const rowList = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i)

    for (const r of rowList) {
      for (const c of colList) {
        if (!isFunction[r][c]) {
          let bit = 0
          if (bitIndex < totalBits) {
            const byte = fullCodewords[Math.floor(bitIndex / 8)]
            bit = (byte >> (7 - (bitIndex % 8))) & 1
            bitIndex++
          }
          // Mask 0: flip if (r + c) is even
          const mask = (r + c) % 2 === 0
          matrix[r][c] = (bit ^ (mask ? 1 : 0)) === 1
        }
      }
    }
    upward = !upward
  }

  // Format bits for ECC M + Mask 0 (0x5412)
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]
  for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i] === 1
  matrix[8][7] = formatBits[6] === 1
  matrix[8][8] = formatBits[7] === 1
  matrix[7][8] = formatBits[8] === 1
  for (let i = 0; i < 6; i++) matrix[5 - i][8] = formatBits[9 + i] === 1

  for (let i = 0; i < 7; i++) matrix[size - 1 - i][8] = formatBits[i] === 1
  for (let i = 0; i < 8; i++) matrix[8][size - 8 + i] = formatBits[7 + i] === 1

  return matrix
}
