import { auth } from '@/auth'

export async function getSessionUser() {
  const session = await auth()
  return session?.user ?? null
}

export async function requireRole(role: 'buyer' | 'seller' | 'admin') {
  const user = await getSessionUser()
  if (!user || (user as any).role !== role) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireBusiness() {
  const user = await getSessionUser()
  if (!user || !(user as any).is_business) {
    throw new Error('Unauthorized')
  }
  return user
}
