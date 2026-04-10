'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SellerRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '', password: '', name: '', phone: '', business_name: '', business_id: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/seller/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push('/seller/onboarding')
  }

  return (
    <main className="max-w-md mx-auto mt-20 p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">הרשמה כמוכר</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder="אימייל *" onChange={set('email')} className="w-full border rounded p-2" required />
        <input type="password" placeholder="סיסמה *" onChange={set('password')} className="w-full border rounded p-2" required />
        <input placeholder="שם מלא" onChange={set('name')} className="w-full border rounded p-2" />
        <input placeholder="שם עסק *" onChange={set('business_name')} className="w-full border rounded p-2" required />
        <input placeholder="ח.פ / עוסק מורשה" onChange={set('business_id')} className="w-full border rounded p-2" />
        <input placeholder="טלפון" onChange={set('phone')} className="w-full border rounded p-2" />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">
          {loading ? 'נרשם...' : 'הרשמה'}
        </button>
      </form>
    </main>
  )
}
