import { useState, useEffect } from 'react'

function getRoute() {
  const hash = window.location.hash || '#'
  if (hash.startsWith('#/v/')) {
    const data = hash.slice(4)
    return { page: 'viewer', data }
  }
  return { page: 'creator' }
}

/** Tracks window.location.hash; returns { page, data } where data is the
 *  raw encoded payload string for viewer routes. */
export default function useRouter() {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}
