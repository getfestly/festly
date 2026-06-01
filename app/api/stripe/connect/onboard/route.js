import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createStripeConnectAccount, createOnboardingLink } from '@/lib/payments'

export async function POST(request) {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, stripe_account_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'provider') {
    return NextResponse.json(
      { error: 'Nur Anbieter können ein Zahlungskonto verbinden.' },
      { status: 403 }
    )
  }

  try {
    const origin = request.nextUrl.origin
    const returnUrl  = `${origin}/dashboard/provider/stripe-return`
    const refreshUrl = `${origin}/dashboard/provider/stripe-refresh`

    let stripeAccountId = profile.stripe_account_id
    if (!stripeAccountId) {
      stripeAccountId = await createStripeConnectAccount(user.id, user.email)
    }

    const url = await createOnboardingLink(stripeAccountId, returnUrl, refreshUrl)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[stripe/onboard]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
