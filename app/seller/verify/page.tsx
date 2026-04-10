'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function SellerVerifyPage() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    const res = await fetch('/api/listings/verify-request', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setSubmitted(true)
  }

  return (
    <main className="max-w-md mx-auto p-6 mt-10" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">בקשת אימות</h1>
      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p className="text-green-800">הבקשה נשלחה! נחזור אליך תוך 1-2 ימי עסקים.</p>
          <Link href="/seller/dashboard" className="text-blue-600 underline text-sm mt-2 block">
            חזור ללוח הבקרה
          </Link>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-6">
            קבל תג ✓ מאומת שמוצג על פרופילך ועל כל המוצרים שלך. תג האימות מגביר אמון ומוביל
            למכירות מהירות יותר.
          </p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            onClick={submit}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            שלח בקשת אימות
          </button>
        </div>
      )}
    </main>
  )
}
