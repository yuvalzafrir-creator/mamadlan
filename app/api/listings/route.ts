import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { validateListing, type ListingInput } from '@/lib/listings'
import { getSessionUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { searchParams } = new URL(request.url)
  let query = supabase
    .from('listings')
    .select('*, profiles!seller_id(name, verified, business_name)')
    .eq('status', 'active')
  if (searchParams.get('type')) query = query.eq('type', searchParams.get('type')!)
  if (searchParams.get('minPrice')) query = query.gte('price', parseInt(searchParams.get('minPrice')!))
  if (searchParams.get('maxPrice')) query = query.lte('price', parseInt(searchParams.get('maxPrice')!))
  if (searchParams.get('location')) query = query.ilike('location', `%${searchParams.get('location')}%`)
  if (searchParams.get('shipping_option')) query = query.eq('shipping_option', searchParams.get('shipping_option')!)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'seller') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body: ListingInput = await request.json()
  try {
    validateListing(body)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('listings')
    .insert({
      ...body,
      seller_id: user.id,
      status: user.stripe_account_id ? 'active' : 'paused',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
