import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { KATEGORIE_LABEL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

async function deactivateListing(formData) {
  'use server'
  const supabase = createAdminClient()
  const id = formData.get('id')
  await supabase.from('listings').update({ is_active: false }).eq('id', id)
  revalidatePath('/admin/listings')
}

export default async function AdminListingsPage() {
  const supabase = createAdminClient()
  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, category, price_cents, is_active, created_at, profiles(display_name)')
    .order('created_at', { ascending: false })

  const aktiv  = listings?.filter((l) => l.is_active).length ?? 0
  const gesamt = listings?.length ?? 0

  return (
    <>
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Listings ({gesamt})</h1>
        <span className="text-sm text-gray-400">{aktiv} aktiv · {gesamt - aktiv} inaktiv</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Titel</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Anbieter</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Kategorie</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Preis</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Erstellt</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listings?.map((listing) => (
                <tr key={listing.id} className={`hover:bg-gray-50/60 ${!listing.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 max-w-[200px] truncate">{listing.title}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {listing.profiles?.display_name ?? '–'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5">
                      {KATEGORIE_LABEL[listing.category] ?? listing.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                    {(listing.price_cents / 100).toLocaleString('de-DE', {
                      style: 'currency', currency: 'EUR',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {listing.is_active
                      ? <span className="text-xs text-green-600 font-medium">Aktiv</span>
                      : <span className="text-xs text-gray-400">Inaktiv</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(listing.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-4 py-3">
                    {listing.is_active && (
                      <form action={deactivateListing}>
                        <input type="hidden" name="id" value={listing.id} />
                        <button
                          type="submit"
                          className="text-xs border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors whitespace-nowrap"
                        >
                          Deaktivieren
                        </button>
                      </form>
                    )}
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
