import { getOccasion } from '../templates'

export const DEFAULT_THEME = { name: 'Default', from: '#667eea', to: '#764ba2', text: '#fff' }

/** Find the theme object for a link payload: match by name inside the
 *  occasion's themes, else the occasion's first theme, else a default purple. */
export default function getTheme(data) {
  const occasion = getOccasion(data?.occasion)
  const themes = occasion?.themes || []
  const byName = data?.theme ? themes.find((t) => t.name === data.theme) : null
  return byName || themes[0] || DEFAULT_THEME
}
