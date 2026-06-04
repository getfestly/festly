import { createSupabaseServer } from '@/lib/supabase-server'
import NavClient from './NavClient'

// Server Component — liest Session serverseitig, gibt initialUser/Profile als Props
// an NavClient weiter. Wrapped in <Suspense> in layout.js damit ein Fehler oder
// eine langsame Session die gesamte Seite nicht blockiert.
export default async function Nav() {
  let user         = null
  let profile      = null
  let pendingCount = 0

  try {
    const supabase = await createSupabaseServer()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user = authUser

    if (user) {
      const [profileRes, pendingRes] = await Promise.all([
        supabase.from('profiles').select('display_name, role').eq('id', user.id).single(),
        supabase.from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', user.id)
          .in('status', ['pending', 'accepted']),
      ])
      profile      = profileRes.data
      pendingCount = pendingRes.count ?? 0
    }
  } catch {
    // Session-Fehler abfangen — NavClient rendert ohne Auth-Daten (= ausgeloggt)
  }

  return (
    <NavClient
      initialUser={user}
      initialProfile={profile}
      initialPendingCount={pendingCount}
    />
  )
}
