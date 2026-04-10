import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  let event: any

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object
    await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('stripe_payment_intent_id', pi.id)
    await supabase
      .from('listings')
      .update({ status: 'sold' })
      .eq('id', pi.metadata.listing_id)
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object
    await supabase
      .from('orders')
      .update({ status: 'pending_payment' })
      .eq('stripe_payment_intent_id', pi.id)
  }

  return NextResponse.json({ received: true })
}
