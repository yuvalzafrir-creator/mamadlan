import { createServerSupabaseClient } from './supabase/server'

export async function getSessionUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return profile
}

export async function requireRole(role: 'buyer' | 'seller' | 'admin') {
  const user = await getSessionUser()
  if (!user || user.role !== role) {
    throw new Error('Unauthorized')
  }
  return user
}
