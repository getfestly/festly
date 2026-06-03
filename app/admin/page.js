import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

async function fetchAnalytics(supabase) {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [regsRes, startedRes, completedRes, detailsRes] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true })
      .eq('event_name', 'user_registered').gte('created_at', cutoff),
    supabase.from('events').select('id', { count: 'exact', head: true })
      .eq('event_name', 'booking_submitted').gte('created_at', cutoff),
    supabase.from('events').select('properties')
      .eq('event_name', 'payment_completed').gte('created_at', cutoff),
    supabase.from('events').select('properties')
      .eq('event_name', 'listing_detail_viewed').gte('created_at', cutoff),
  ])

  const completedPayments = completedRes.data ?? []
  const gmvCents = completedPayments.reduce((sum, e) => {
    return sum + (parseInt(e.properties?.amount_cents) || 0)
  }, 0)
  const avgCents = completedPayments.length > 0
    ? Math.round(gmvCents / completedPayments.length)
    : 0

  const categoryCount = {}
  for (const e of (detailsRes.data ?? [])) {
    const cat = e.properties?.category ?? 'unbekannt'
    categoryCount[cat] = (categoryCount[cat] ?? 0) + 1
  }
  const top5Categories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const convRate = (regsRes.count ?? 0) > 0
    ? Math.round(((completedRes.data?.length ?? 0) / (startedRes.count ?? 1)) * 100)
    : 0

  return {
    registrations30d:  regsRes.count ?? 0,
    bookingsStarted:   startedRes.count ?? 0,
    paymentsCompleted: completedPayments.length,
    conversionRate:    convRate,
    gmvCents,
    avgCents,
    top5Categories,
  }
}

const STATUS_LABEL = {
  pending:   'Ausstehend',
  accepted:  'Angenommen',
  paid:      'Bezahlt',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
  rejected:  'Abgelehnt',
}

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  const analytics = await fetchAnalytics(supabase).catch(() => null)

  const [
    { count: totalUsers },
    { count: providers },
    { count: customers },
    { count: activeListings },
    { data: bookings },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('bookings').select('status, commission_cents'),
  ])

  const statusCounts = {}
  let provisionCents = 0
  bookings?.forEach((b) => {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1
    if (b.status === 'completed') provisionCents += b.commission_cents ?? 0
  })

  const totalBookings = bookings?.length ?? 0

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Nutzer & Listings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Nutzer gesamt',   value: totalUsers ?? 0 },
          { label: 'Anbieter',        value: providers ?? 0 },
          { label: 'Kunden',          value: customers ?? 0 },
          { label: 'Aktive Listings', value: activeListings ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buchungen nach Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Buchungen gesamt: {totalBookings}
          </h2>
          <div className="space-y-2">
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600">{label}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {statusCounts[key] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Provision */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Festly-Provision</h2>
            <p className="text-sm text-gray-400 mb-6">
              Aus abgeschlossenen Buchungen (15 %)
            </p>
            <p className="text-5xl font-bold text-gray-900">
              {(provisionCents / 100).toLocaleString('de-DE', {
                style: 'currency', currency: 'EUR',
              })}
            </p>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            {statusCounts['completed'] ?? 0} abgeschlossene Buchung{(statusCounts['completed'] ?? 0) !== 1 ? 'en' : ''}
          </p>
        </div>
      </div>

      {/* Analytics (letzte 30 Tage) */}
      {analytics && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics — letzte 30 Tage</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Neue Registrierungen',  value: analytics.registrations30d },
              { label: 'Anfragen gestartet',    value: analytics.bookingsStarted },
              { label: 'Zahlungen erfolgreich', value: analytics.paymentsCompleted },
              {
                label: 'Conversion (Anfrage→Zahlung)',
                value: `${analytics.conversionRate} %`,
              },
              {
                label: 'GMV (Buchungsvolumen)',
                value: (analytics.gmvCents / 100).toLocaleString('de-DE', {
                  style: 'currency', currency: 'EUR',
                }),
              },
              {
                label: 'Ø Buchungswert',
                value: analytics.paymentsCompleted > 0
                  ? (analytics.avgCents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                  : '–',
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {analytics.top5Categories.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Top-Kategorien (Detailaufrufe)</h3>
              <div className="space-y-2">
                {analytics.top5Categories.map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-600 capitalize">{cat}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
