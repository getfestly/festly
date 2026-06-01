import { createSupabaseServer } from '@/lib/supabase-server'
import { ADMIN_USER_ID } from '@/lib/admin'
import Nav from '@/components/Nav'
import Link from 'next/link'
import FilterSection from './FilterSection'

async function fetchUserData() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { userRole: null, userId: null }
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  return { userRole: profile?.role ?? null, userId: user.id }
}

function QuickActions({ role, isAdmin }) {
  if (!role) return null

  const btn = 'flex items-center gap-2 bg-purple-600 text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-purple-700 active:bg-purple-800 transition-colors whitespace-nowrap'

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8">
      {isAdmin ? (
        <>
          <Link href="/admin"                 className={btn}>⚙️ Admin-Bereich</Link>
          <Link href="/mein-bereich/anfragen" className={btn}>📋 Anfragen</Link>
        </>
      ) : role === 'provider' ? (
        <>
          <Link href="/anbieter/listings/neu" className={btn}>➕ Angebot erstellen</Link>
          <Link href="/mein-bereich/anfragen" className={btn}>📋 Meine Anfragen</Link>
        </>
      ) : (
        <Link href="/mein-bereich/anfragen"   className={btn}>📋 Meine Anfragen</Link>
      )}
    </div>
  )
}

export default async function MarktplatzPage() {
  const { userRole, userId } = await fetchUserData()
  const isAdmin = userId === ADMIN_USER_ID

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Marktplatz</h1>
        <QuickActions role={userRole} isAdmin={isAdmin} />
        <FilterSection />
      </main>
    </div>
  )
}
