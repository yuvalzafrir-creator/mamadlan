import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('listings')
    .select('*, profiles!seller_id(name, verified, business_name, phone)')
    .eq('id', params.id)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerSupabaseClient()
  const { data: listing } = await supabase
    .from('listings')
    .select('seller_id')
    .eq('id', params.id)
    .single()
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (listing.seller_id !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json()
  const { data, error } = await supabase
    .from('listings')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerSupabaseClient()
  const { data: listing } = await supabase
    .from('listings')
    .select('seller_id')
    .eq('id', params.id)
    .single()
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (listing.seller_id !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await supabase.from('listings').update({ status: 'paused' }).eq('id', params.id)
  return NextResponse.json({ success: true })
}
