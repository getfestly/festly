import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

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
    </>
  )
}
