import { Suspense } from 'react'
import NavClient from './NavClient'

// Kein async, kein Server-Fetch — NavClient holt Auth client-seitig via getSession()
// Suspense-Wrapper als defensive Grenze für usePathname() in NavClient
export default function Nav() {
  return (
    <Suspense>
      <NavClient />
    </Suspense>
  )
}
