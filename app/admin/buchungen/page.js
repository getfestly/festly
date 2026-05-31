import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const STATUS_STYLE = {
  pending:   'bg-amber-100 text-amber-700',
  accepted:  'bg-blue-100 text-blue-700',
  paid:      'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  rejected:  'bg-red-100 text-red-600',
}

const STATUS_LABEL = {
  pending:   'Ausstehend',
  accepted:  'Angenommen',
  paid:      'Bezahlt',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
  rejected:  'Abgelehnt',
}

export default async function AdminBuchungenPage() {
  const supabase = createAdminClient()
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, status, event_date, amount_cents, commission_cents, created_at,
      listings(title),
      customer:profiles!bookings_customer_id_fkey(display_name),
      provider:profiles!bookings_provider_id_fkey(display_name)
    `)
    .order('created_at', { ascending: false })

  const totalProvision = bookings
    ?.filter((b) => b.status === 'completed')
    .reduce((s, b) => s + (b.commission_cents ?? 0), 0) ?? 0

  return (
    <>
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buchungen ({bookings?.length ?? 0})</h1>
        <span className="text-sm text-gray-400">
          Provision gesamt:{' '}
          {(totalProvision / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Listing</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Kunde</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Anbieter</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Event-Datum</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Betrag</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Provision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings?.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 max-w-[180px] truncate">
                      {booking.listings?.title ?? '–'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {booking.customer?.display_name ?? '–'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {booking.provider?.display_name ?? '–'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">
                    {new Date(booking.event_date).toLocaleDateString('de-DE', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
                      STATUS_STYLE[booking.status] ?? 'bg-gray-100 text-gray-500'
                    }`}>
                      {STATUS_LABEL[booking.status] ?? booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                    {(booking.amount_cents / 100).toLocaleString('de-DE', {
                      style: 'currency', currency: 'EUR',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs whitespace-nowrap">
                    {booking.commission_cents
                      ? (booking.commission_cents / 100).toLocaleString('de-DE', {
                          style: 'currency', currency: 'EUR',
                        })
                      : '–'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
