import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { calculateCommission } from '@/lib/commission'

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listing_id, shipping_type } = await request.json()
  const supabase = createServerSupabaseClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles!seller_id(stripe_account_id)')
    .eq('id', listing_id)
    .eq('status', 'active')
    .single()

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  const { data: config } = await supabase.from('platform_config').select('*').single()
  const commissionAmount = calculateCommission(listing.price, config!.commission_rate)
  const shippingAmount =
    shipping_type === 'platform'
      ? config!.platform_shipping_price
      : shipping_type === 'seller'
      ? (listing.shipping_price ?? 0)
      : 0

  const totalAmount = listing.price + shippingAmount
  const sellerAccountId = (listing.profiles as any).stripe_account_id

  // Prevent duplicate orders — reuse existing pending order
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, stripe_payment_intent_id')
    .eq('listing_id', listing_id)
    .eq('buyer_id', user.id)
    .eq('status', 'pending_payment')
    .single()

  if (existingOrder?.stripe_payment_intent_id) {
    const pi = await stripe.paymentIntents.retrieve(existingOrder.stripe_payment_intent_id)
    return NextResponse.json({ clientSecret: pi.client_secret, orderId: existingOrder.id })
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: 'ils',
    transfer_data: { destination: sellerAccountId },
    application_fee_amount: commissionAmount,
    metadata: {
      listing_id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      shipping_type,
    },
  })

  const adminSupabase = createAdminSupabaseClient()
  const { data: order } = await adminSupabase
    .from('orders')
    .insert({
      listing_id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount: listing.price,
      commission_amount: commissionAmount,
      shipping_amount: shippingAmount,
      shipping_type,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending_payment',
    })
    .select()
    .single()

  return NextResponse.json({ clientSecret: paymentIntent.client_secret, orderId: order!.id })
}
