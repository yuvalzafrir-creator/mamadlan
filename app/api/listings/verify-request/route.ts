import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST() {
  let user: any
  try {
    user = await requireRole('seller')
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()
  const { data: existing } = await supabase
    .from('verification_requests')
    .select('id')
    .eq('seller_id', user.id)
    .eq('status', 'pending')
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'בקשה קיימת כבר ממתינה לאישור' },
      { status: 400 }
    )
  }

  await supabase.from('verification_requests').insert({ seller_id: user.id })
  return NextResponse.json({ success: true })
}
