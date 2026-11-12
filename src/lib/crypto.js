const ITERATIONS = 200_000
const KEY_LEN = 32
const ALGO = 'PBKDF2'
const HASH = 'SHA-256'
const ENC_ALGO = 'AES-GCM'
const IV_LEN = 12
const SALT_LEN = 16

/** Base64url helpers */
function b64u(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
function un64u(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

async function deriveKey(answer, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(answer.toLowerCase().trim()),
    ALGO,
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: ALGO, salt, iterations: ITERATIONS, hash: HASH },
    keyMaterial,
    { name: ENC_ALGO, length: KEY_LEN * 8 },
    false,
    ['encrypt', 'decrypt']
  )
}

/** Encrypt {from, to, message} tied to a secret question+answer.
 *  Returns { q, salt, iv, ct } (all base64url strings). */
export async function encryptPayload(data, q, answer) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN))
  const key = await deriveKey(answer, salt)
  const plaintext = new TextEncoder().encode(JSON.stringify(data))
  const ctBuf = await crypto.subtle.encrypt({ name: ENC_ALGO, iv }, key, plaintext)
  return { q, salt: b64u(salt), iv: b64u(iv), ct: b64u(ctBuf) }
}

/** Decrypt; returns parsed object on success or null on wrong answer. */
export async function decryptPayload(secret, answer) {
  try {
    const salt = un64u(secret.salt)
    const iv = un64u(secret.iv)
    const ct = un64u(secret.ct)
    const key = await deriveKey(answer, salt)
    const ptBuf = await crypto.subtle.decrypt({ name: ENC_ALGO, iv }, key, ct)
    return JSON.parse(new TextDecoder().decode(ptBuf))
  } catch {
    return null
  }
}
