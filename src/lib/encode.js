// Kabootar – data encoding / decoding
// JSON -> base64url, round-trips Hindi/Assamese safely.

export function encodeData(obj) {
  return btoa(encodeURIComponent(JSON.stringify(obj)))
}

export function decodeData(str) {
  try {
    if (!str || typeof str !== 'string') return null
    const json = decodeURIComponent(atob(str.trim()))
    return JSON.parse(json)
  } catch {
    return null
  }
}
