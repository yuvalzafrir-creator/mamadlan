import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createAdminSupabaseClient()
  const { data } = await supabase.from('platform_config').select('*').single()
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole('admin')
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('platform_config')
    .update(body)
    .eq('id', 1)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
