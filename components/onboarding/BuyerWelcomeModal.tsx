'use client'
import { useState, useEffect } from 'react'

const STEPS = [
  {
    icon: '🏗️',
    title: 'מה זה ממד / מיגונית?',
    body: 'ממד (מרחב מוגן דירתי) ומיגונית הם מבני מיגון ניידים שהיו בשימוש נרחב בתקופת המלחמה. כיום ניתן לרכוש אותם במחירים נוחים.',
  },
  {
    icon: '🔍',
    title: 'חיפוש חכם',
    body: 'השתמש במסנני החיפוש לבחור סוג, מידות, מחיר ואזור. כל מוצר מציג את פרטי המוכר וסוג המשלוח.',
  },
  {
    icon: '💳',
    title: 'תשלום מאובטח',
    body: 'התשלום מאובטח דרך Stripe. ניתן לבחור משלוח מהמוכר, משלוח דרך האתר, או איסוף עצמי.',
  },
  {
    icon: '🛡️',
    title: 'הגנת קונה',
    body: 'התשלום מוחזק עד לאישור קבלת המוצר. במקרה של בעיה, צרו קשר עם שירות הלקוחות שלנו.',
  },
]

export function BuyerWelcomeModal() {
  const [open, setOpen]   = useState(false)
  const [step, setStep]   = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('buyer_walkthrough_seen')) {
      // slight delay so page renders first
      const t = setTimeout(() => setOpen(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  function dismiss() {
    setLeaving(true)
    setTimeout(() => {
      localStorage.setItem('buyer_walkthrough_seen', '1')
      setOpen(false)
      setLeaving(false)
    }, 250)
  }

  if (!open) return null

  const isLast = step === STEPS.length - 1

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 transition-all duration-300 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Sheet */}
      <div
        className={`relative bg-white rounded-3xl sm:rounded-2xl w-full max-w-md shadow-glass transition-all duration-300 ${
          leaving ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
        }`}
        style={{ animation: leaving ? undefined : 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors text-sm"
        >
          ✕
        </button>

        {/* Icon + header */}
        <div className="pt-8 px-6 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            {STEPS[step].icon}
          </div>
          <h2 className="text-xl font-black text-navy-900 mb-1">{STEPS[step].title}</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-gray-500 text-center leading-relaxed">{STEPS[step].body}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 px-6 pb-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-brand-600' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-5 border-t border-gray-100">
          <button onClick={dismiss} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            דלג
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="btn-secondary text-sm px-4 py-2"
              >
                הקודם
              </button>
            )}
            <button
              onClick={isLast ? dismiss : () => setStep(s => s + 1)}
              className="btn-primary text-sm px-5 py-2"
            >
              {isLast ? 'התחל ←' : 'הבא'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
