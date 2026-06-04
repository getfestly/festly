import { Suspense } from 'react'
import NavClient from './NavClient'

// Kein async, kein Server-Fetch — NavClient holt Auth client-seitig via getSession()
// (liest aus Cookie-Cache, kein Netzwerk-Request, kein Hänger)
// Suspense-Wrapper nötig weil NavClient useSearchParams() verwendet
export default function Nav() {
  return (
    <Suspense>
      <NavClient />
    </Suspense>
  )
}
