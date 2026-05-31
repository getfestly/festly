import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

async function toggleVerified(formData) {
  'use server'
  const supabase = createAdminClient()
  const id = formData.get('id')
  const current = formData.get('current') === 'true'
  await supabase.from('profiles').update({ is_verified: !current }).eq('id', id)
  revalidatePath('/admin/nutzer')
}

export default async function AdminNutzerPage() {
  const supabase = createAdminClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, role, region, is_verified, created_at, legal_name')
    .order('created_at', { ascending: false })

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Nutzer ({profiles?.length ?? 0})
      </h1>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rolle</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Region</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Verifiziert</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Registriert</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {profiles?.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{profile.display_name}</p>
                    {profile.legal_name && profile.legal_name !== profile.display_name && (
                      <p className="text-xs text-gray-400">{profile.legal_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
                      profile.role === 'provider'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {profile.role === 'provider' ? 'Anbieter' : 'Kunde'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{profile.region ?? '–'}</td>
                  <td className="px-4 py-3">
                    {profile.is_verified
                      ? <span className="text-green-600 font-medium text-xs">✓ Ja</span>
                      : <span className="text-gray-400 text-xs">–</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(profile.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleVerified}>
                      <input type="hidden" name="id" value={profile.id} />
                      <input type="hidden" name="current" value={String(profile.is_verified ?? false)} />
                      <button
                        type="submit"
                        className={`text-xs border rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap ${
                          profile.is_verified
                            ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            : 'border-green-200 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {profile.is_verified ? 'Entfernen' : 'Verifizieren'}
                      </button>
                    </form>
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
