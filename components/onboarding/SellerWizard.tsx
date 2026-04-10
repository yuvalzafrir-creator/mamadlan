'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  { id: 1, label: 'פרופיל עסקי' },
  { id: 2, label: 'חשבון בנק' },
  { id: 3, label: 'מוצר ראשון' },
  { id: 4, label: 'אימות' },
]

export function SellerWizard({ initialStep = 1 }: { initialStep?: number }) {
  const [step, setStep] = useState(initialStep)
  const [stripeLoading, setStripeLoading] = useState(false)
  const router = useRouter()

  async function connectStripe() {
    setStripeLoading(true)
    const res = await fetch('/api/stripe/connect', { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="max-w-xl mx-auto mt-10 p-6" dir="rtl">
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          {STEPS.map(s => (
            <span key={s.id} className={`font-medium ${step >= s.id ? 'text-blue-600' : 'text-gray-400'}`}>
              {s.label}
            </span>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold mb-4">הפרופיל שלך מוכן!</h2>
          <p className="text-gray-600 mb-6">בשלב הבא תחבר את חשבון הבנק שלך דרך Stripe.</p>
          <button onClick={() => setStep(2)} className="bg-blue-600 text-white px-6 py-2 rounded">המשך</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold mb-4">חיבור חשבון בנק</h2>
          <p className="text-gray-600 mb-6">Stripe מאפשר קבלת תשלומים מאובטחת.</p>
          <button onClick={connectStripe} disabled={stripeLoading}
            className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50">
            {stripeLoading ? 'מתחבר...' : 'חבר חשבון בנק דרך Stripe'}
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold mb-4">פרסם את המוצר הראשון שלך</h2>
          <p className="text-gray-600 mb-6">עכשיו תוכל לפרסם ממד/מיגונית למכירה.</p>
          <button onClick={() => router.push('/seller/listings/new')}
            className="bg-blue-600 text-white px-6 py-2 rounded ml-4">
            פרסם מוצר
          </button>
          <button onClick={() => setStep(4)} className="text-gray-500 underline">דלג</button>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="text-xl font-bold mb-4">מוכן!</h2>
          <p className="text-gray-600 mb-4">תרצה לקבל תג ✓ מאומת שמגביר אמון קונים?</p>
          <button onClick={() => router.push('/seller/verify')}
            className="bg-blue-600 text-white px-6 py-2 rounded ml-4">
            בקש אימות
          </button>
          <button onClick={() => router.push('/seller/dashboard')} className="text-gray-500 underline">
            עבור ללוח הבקרה
          </button>
        </div>
      )}
    </div>
  )
}
