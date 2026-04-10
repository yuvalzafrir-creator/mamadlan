import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('admin')
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action } = await request.json() // 'approve' | 'reject'
  const supabase = createAdminSupabaseClient()

  if (action === 'approve') {
    await supabase.from('profiles').update({ verified: true }).eq('id', params.id)
    await supabase
      .from('verification_requests')
      .update({ status: 'approved' })
      .eq('seller_id', params.id)
      .eq('status', 'pending')
  } else {
    await supabase
      .from('verification_requests')
      .update({ status: 'rejected' })
      .eq('seller_id', params.id)
      .eq('status', 'pending')
  }

  return NextResponse.json({ success: true })
}
