import { Suspense } from 'react'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { ADMIN_USER_ID } from '@/lib/admin'
import Nav from '@/components/Nav'
import Link from 'next/link'
import FilterSection from './FilterSection'

async function fetchPageData() {
  const supabase = await createSupabaseServer()
  const admin = createAdminClient()

  // ── Nutzer + Rolle ────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  let userRole = null
  let userId = null
  if (user) {
    userId = user.id
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    userRole = profile?.role ?? null
  }

  // ── Parallele Daten für Rahmen & Badges ───────────────────────────────────
  const [bookingsRes, reviewsRes, respondedRes] = await Promise.all([
    // Buchungszähler pro Listing (admin: bookings RLS erlaubt nur Beteiligte)
    admin.from('bookings')
      .select('listing_id')
      .neq('status', 'cancelled')
      .not('listing_id', 'is', null),

    // Bewertungen pro Listing (public RLS)
    supabase.from('reviews')
      .select('listing_id, rating')
      .not('listing_id', 'is', null),

    // Antwortzeiten pro Anbieter (admin: gleiche RLS-Einschränkung)
    admin.from('bookings')
      .select('provider_id, created_at, provider_responded_at')
      .not('provider_responded_at', 'is', null),
  ])

  // ── Rahmenfarben ─────────────────────────────────────────────────────────
  const countMap = {}
  for (const { listing_id } of bookingsRes.data ?? []) {
    countMap[listing_id] = (countMap[listing_id] ?? 0) + 1
  }

  const ratingMap = {}
  for (const { listing_id, rating } of reviewsRes.data ?? []) {
    if (!ratingMap[listing_id]) ratingMap[listing_id] = { sum: 0, count: 0 }
    ratingMap[listing_id].sum += rating
    ratingMap[listing_id].count++
  }

  // Priorität: Gold > Orange (Blau wird im Client aus created_at berechnet)
  const borderByListing = {}
  for (const [id, { sum, count }] of Object.entries(ratingMap)) {
    if (count >= 100 && sum / count >= 4.5) borderByListing[id] = 'gold'
  }
  for (const [id, count] of Object.entries(countMap)) {
    if (count >= 3 && !borderByListing[id]) borderByListing[id] = 'orange'
  }

  // ── Antwortzeiten ────────────────────────────────────────────────────────
  const rawResponse = {}
  for (const { provider_id, created_at, provider_responded_at } of respondedRes.data ?? []) {
    if (!provider_id || !created_at || !provider_responded_at) continue
    if (!rawResponse[provider_id]) rawResponse[provider_id] = { totalMs: 0, count: 0 }
    rawResponse[provider_id].totalMs += new Date(provider_responded_at) - new Date(created_at)
    rawResponse[provider_id].count++
  }

  const responseByProvider = {}
  for (const [providerId, { totalMs, count }] of Object.entries(rawResponse)) {
    if (count < 3) continue
    const avgHours = totalMs / count / (1000 * 60 * 60)
    let label
    if (avgHours < 2)       label = '⚡ Antwortet sehr schnell'
    else if (avgHours < 24) label = '🕐 Antwortet schnell'
    else                    label = '🕓 Antwortet manchmal langsam'
    responseByProvider[providerId] = { label, avgHours }
  }

  return { userRole, userId, borderByListing, responseByProvider }
}

function QuickActions({ role, isAdmin }) {
  if (!role) return null

  const btn = 'flex items-center gap-2 btn-primary px-5 py-3 text-sm font-medium'

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
  const { userRole, userId, borderByListing, responseByProvider } = await fetchPageData()
  const isAdmin = userId === ADMIN_USER_ID

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Marktplatz</h1>
        <QuickActions role={userRole} isAdmin={isAdmin} />
        <Suspense fallback={<div className="flex items-center justify-center py-24 text-gray-400">Lade Angebote …</div>}>
          <FilterSection responseByProvider={responseByProvider} />
        </Suspense>
      </main>
    </div>
  )
}
