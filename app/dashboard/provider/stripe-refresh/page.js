import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createOnboardingLink } from '@/lib/payments'

// Diese Seite generiert einen neuen Onboarding-Link und leitet sofort weiter.
export default async function StripeRefreshPage() {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_account_id) redirect('/mein-bereich')

  let onboardingUrl
  try {
    const headerStore = await headers()
    const host  = headerStore.get('host') ?? 'localhost:3000'
    const proto = headerStore.get('x-forwarded-proto') ?? 'http'
    const origin = `${proto}://${host}`

    onboardingUrl = await createOnboardingLink(
      profile.stripe_account_id,
      `${origin}/dashboard/provider/stripe-return`,
      `${origin}/dashboard/provider/stripe-refresh`
    )
  } catch {
    redirect('/mein-bereich')
  }

  redirect(onboardingUrl)
}
