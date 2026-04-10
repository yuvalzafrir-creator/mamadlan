'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LanguageToggle } from './LanguageToggle'

export function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      setUser(data.user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      setRole(profile?.role ?? null)
    })
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="border-b bg-white px-6 py-3 flex justify-between items-center" dir="rtl">
      <Link href="/" className="text-xl font-bold text-blue-700">
        ממד שוק
      </Link>
      <div className="flex gap-4 items-center text-sm">
        <Link href="/listings">מוצרים</Link>
        <Link href="/how-it-works">איך זה עובד?</Link>
        {user ? (
          <>
            {role === 'buyer' || role === null ? (
              <Link href="/orders">הזמנות</Link>
            ) : null}
            {role === 'seller' && (
              <Link href="/seller/dashboard">לוח המוכר</Link>
            )}
            {role === 'admin' && (
              <Link href="/admin/dashboard">ניהול</Link>
            )}
            <button onClick={logout} className="text-gray-500 hover:text-gray-700">
              יציאה
            </button>
          </>
        ) : (
          <>
            <Link href="/login">כניסה</Link>
            <Link
              href="/seller/register"
              className="bg-blue-600 text-white px-3 py-1.5 rounded"
            >
              הרשמה כמוכר
            </Link>
          </>
        )}
        <LanguageToggle />
      </div>
    </nav>
  )
}
