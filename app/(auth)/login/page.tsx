'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="max-w-md mx-auto mt-20 p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">כניסה</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input type="email" placeholder="אימייל" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full border rounded p-2" required />
        <input type="password" placeholder="סיסמה" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border rounded p-2" required />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">
          {loading ? 'מתחבר...' : 'כניסה'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        מוכר? <Link href="/seller/register" className="text-blue-600 underline">הרשם כאן</Link>
      </p>
    </main>
  )
}
