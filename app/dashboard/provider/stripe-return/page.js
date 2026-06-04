import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { checkAccountStatus } from '@/lib/payments'

export const metadata = { title: 'Bankkonto verbinden – Festly' }

export default async function StripeReturnPage() {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_account_id) redirect('/mein-bereich')

  // Aktuellen Kontostatus von Stripe abrufen und in DB aktualisieren
  let complete = profile.stripe_onboarding_complete
  try {
    const status = await checkAccountStatus(profile.stripe_account_id)
    complete = status.charges_enabled
  } catch {
    // Stripe nicht erreichbar — gespeicherten Wert verwenden
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        {complete ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verbindung erfolgreich</h1>
            <p className="text-gray-500 mb-8">
              Dein Bankkonto ist verbunden. Du kannst jetzt Auszahlungen für abgeschlossene Buchungen empfangen.
            </p>
            <Link
              href="/mein-bereich"
              className="bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-700 transition-colors"
            >
              Zum Konto
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">
              !
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Noch nicht abgeschlossen</h1>
            <p className="text-gray-500 mb-8">
              Das Onboarding wurde noch nicht vollständig abgeschlossen.
              Bitte führe alle Schritte in Stripe aus, um Auszahlungen zu erhalten.
            </p>
            <Link
              href="/dashboard/provider/stripe-refresh"
              className="bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-700 transition-colors"
            >
              Onboarding fortsetzen
            </Link>
          </>
        )}
      </main>
    </div>
  )
}
