import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSessionUser } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'seller') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let accountId = user.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'IL',
      email: user.email,
      capabilities: { transfers: { requested: true } },
    })
    accountId = account.id
    const supabase = createAdminSupabaseClient()
    await supabase.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id)
    // Activate paused listings now that Stripe is connected
    await supabase.from('listings').update({ status: 'active' }).eq('seller_id', user.id).eq('status', 'paused')
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/onboarding?step=stripe&refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/onboarding?step=stripe&success=true`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
