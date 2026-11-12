import { useState, useEffect } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/** Returns true when the user has prefers-reduced-motion set (reactive). */
export default function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const fn = (e) => setReduced(e.matches)
    mql.addEventListener('change', fn)
    return () => mql.removeEventListener('change', fn)
  }, [])

  return reduced
}
