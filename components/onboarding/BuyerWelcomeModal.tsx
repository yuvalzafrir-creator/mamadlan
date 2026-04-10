'use client'
import { useState, useEffect } from 'react'

const STEPS = [
  {
    title: 'מה זה ממד / מיגונית?',
    body: 'ממד (מרחב מוגן דירתי) ומיגונית הם מבני מיגון ניידים שהיו בשימוש נרחב בתקופת המלחמה. כיום ניתן לרכוש אותם במחירים נוחים.',
  },
  {
    title: 'חיפוש ומסנן',
    body: 'השתמש במסנני החיפוש לבחור סוג, מידות, מחיר ואזור. כל מוצר מציג את פרטי המוכר וסוג המשלוח.',
  },
  {
    title: 'תשלום ומשלוח',
    body: 'התשלום מאובטח דרך Stripe. ניתן לבחור משלוח מהמוכר, משלוח דרך האתר, או איסוף עצמי.',
  },
  {
    title: 'הגנת קונה',
    body: 'התשלום מוחזק עד לאישור קבלת המוצר. במקרה של בעיה, צרו קשר עם שירות הלקוחות שלנו.',
  },
]

export function BuyerWelcomeModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem('buyer_walkthrough_seen')) setOpen(true)
  }, [])

  function dismiss() {
    localStorage.setItem('buyer_walkthrough_seen', '1')
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6" dir="rtl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">ברוכים הבאים</h2>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="flex gap-1 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <h3 className="font-semibold text-lg mb-2">{STEPS[step].title}</h3>
        <p className="text-gray-600 mb-6">{STEPS[step].body}</p>
        <div className="flex justify-between">
          <button onClick={dismiss} className="text-gray-400 underline text-sm">דלג</button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} className="bg-blue-600 text-white px-4 py-2 rounded">
              הבא
            </button>
          ) : (
            <button onClick={dismiss} className="bg-blue-600 text-white px-4 py-2 rounded">
              התחל
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
