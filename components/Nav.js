import NavClient from './NavClient'

// Kein async, kein Server-Fetch — NavClient holt Auth client-seitig via getSession()
// (liest aus Cookie-Cache, kein Netzwerk-Request, kein Hänger)
export default function Nav() {
  return <NavClient />
}
