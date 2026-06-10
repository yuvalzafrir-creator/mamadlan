'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [isBusiness, setIsBusiness] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError('')
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email') as string
    const password = fd.get('password') as string
    const res = await fetch('/api/buyer/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, password,
        name: fd.get('name'),
        phone: fd.get('phone'),
        is_business: isBusiness,
        org_name: isBusiness ? fd.get('org_name') : null,
        org_type: isBusiness ? fd.get('org_type') : null,
        contact_name: isBusiness ? fd.get('contact_name') : null,
      }),
    })
    if (!res.ok) {
      const j = await res.json()
      setError(j.error === 'Email already registered' ? 'האימייל כבר רשום במערכת' : j.error || 'שגיאה בהרשמה')
      setLoading(false)
      return
    }
    await signIn('credentials', { email, password, redirect: false })
    router.push(isBusiness ? '/b2b' : '/')
    router.refresh()
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-black text-2xl">מ</span>
          </div>
          <h1 className="text-2xl font-black text-navy-900">הרשמה לממ&quot;דלן</h1>
          <p className="text-gray-500 text-sm mt-1">קנייה בטוחה של מבני מיגון</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="block text-sm font-semibold text-navy-700 mb-2">סוג החשבון</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setIsBusiness(false)}
                  className={`px-4 py-3 rounded-xl border text-sm font-bold transition-colors ${!isBusiness ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300 text-gray-600'}`}>
                  לקוח פרטי
                </button>
                <button type="button" onClick={() => setIsBusiness(true)}
                  className={`px-4 py-3 rounded-xl border text-sm font-bold transition-colors ${isBusiness ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300 text-gray-600'}`}>
                  עסק / רשות
                </button>
              </div>
            </div>

            <input name="name" required placeholder="שם מלא" className="input" />
            <input name="email" type="email" required placeholder="כתובת אימייל" className="input" dir="ltr" />
            <input name="password" type="password" required minLength={6} placeholder="סיסמה (לפחות 6 תווים)" className="input" dir="ltr" />
            <input name="phone" placeholder="טלפון" className="input" />

            {isBusiness && (
              <div className="space-y-4 border-t border-gray-100 pt-4">
                <input name="org_name" required placeholder="שם הארגון / העסק" className="input" />
                <select name="org_type" className="input" defaultValue="company">
                  <option value="company">חברה</option>
                  <option value="municipality">רשות / עירייה</option>
                  <option value="other">אחר</option>
                </select>
                <input name="contact_name" placeholder="איש קשר לרכש" className="input" />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base justify-center">
              {loading ? 'נרשם...' : 'הרשמה'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
            כבר יש לך חשבון?{' '}
            <Link href="/login" className="text-brand-600 font-semibold hover:underline">כניסה</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
