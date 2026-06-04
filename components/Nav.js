import { createSupabaseServer } from '@/lib/supabase-server'
import NavClient from './NavClient'

// Server Component — liest Session serverseitig, gibt initialUser/Profile als Props
// an NavClient weiter. Dadurch kein Hydration-Flicker beim ersten Render.
export default async function Nav() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let profile      = null
  let pendingCount = 0

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

  return (
    <NavClient
      initialUser={user}
      initialProfile={profile}
      initialPendingCount={pendingCount}
    />
  )
}
