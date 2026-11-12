import { useState, useEffect } from 'react'

/** Returns true when the query matches (e.g. "(min-width: 768px)"). */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const fn = (e) => setMatches(e.matches)
    mql.addEventListener('change', fn)
    return () => mql.removeEventListener('change', fn)
  }, [query])
  return matches
}
