import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { email, password, name, phone, business_name, business_id } = await request.json()
  if (!email || !password || !business_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  await supabase
    .from('profiles')
    .update({
      role: 'seller',
      name,
      phone,
      business_name,
      business_id,
      onboarding_step: 1,
    })
    .eq('id', authData.user.id)

  return NextResponse.json({ success: true }, { status: 201 })
}
