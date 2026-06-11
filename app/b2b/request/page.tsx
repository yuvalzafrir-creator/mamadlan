'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NEED_TYPES = [
  { value: 'bulk', label: 'כמות גדולה' },
  { value: 'sourcing', label: 'איתור / מקור אספקה' },
  { value: 'po_deal', label: 'רכש מול הזמנת רכש' },
  { value: 'custom', label: 'התאמה אישית' },
]

export default function SourcingFormPage() {
  const router = useRouter()
  const [needTypes, setNeedTypes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true); setError('')
    const fd = new FormData(e.currentTarget)
    const payload = {
      org_name: fd.get('org_name'),
      org_type: fd.get('org_type'),
      contact_name: fd.get('contact_name'),
      contact_phone: fd.get('contact_phone'),
      contact_email: fd.get('contact_email'),
      need_type: needTypes,
      shelter_type: fd.get('shelter_type'),
      quantity: fd.get('quantity') ? Number(fd.get('quantity')) : null,
      location: fd.get('location'),
      target_date: fd.get('target_date') || null,
      budget_note: fd.get('budget_note'),
      description: fd.get('description'),
    }
    const res = await fetch('/api/b2b/requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSubmitting(false)
    if (res.status === 401) { router.push('/login?next=/b2b/request'); return }
    if (!res.ok) { const j = await res.json(); setError(j.error || 'שגיאה'); return }
    router.push('/b2b/requests')
  }

  function toggle(v: string) {
    setNeedTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  return (
    <main dir="rtl" className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black text-navy-900 mb-6">בקשת רכש לארגונים</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input name="org_name" required placeholder="שם הארגון" className="input w-full" />
        <select name="org_type" className="input w-full" defaultValue="company">
          <option value="company">חברה</option>
          <option value="municipality">רשות / עירייה</option>
          <option value="other">אחר</option>
        </select>
        <input name="contact_name" required placeholder="איש קשר" className="input w-full" />
        <input name="contact_phone" placeholder="טלפון" className="input w-full" />
        <input name="contact_email" type="email" placeholder="אימייל" className="input w-full" />

        <div>
          <p className="text-sm font-semibold mb-2">סוג הצורך</p>
          <div className="flex flex-wrap gap-2">
            {NEED_TYPES.map(nt => (
              <button type="button" key={nt.value} onClick={() => toggle(nt.value)}
                className={`px-3 py-1.5 rounded-full border text-sm ${needTypes.includes(nt.value) ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300'}`}>
                {nt.label}
              </button>
            ))}
          </div>
        </div>

        <select name="shelter_type" className="input w-full" defaultValue="any">
          <option value="any">כל סוג</option>
          <option value="mamad">ממ&quot;ד</option>
          <option value="migounit">מיגונית</option>
          <option value="other">אחר</option>
        </select>
        <input name="quantity" type="number" min="1" placeholder="כמות" className="input w-full" />
        <input name="location" placeholder="אזור / עיר" className="input w-full" />
        <input name="target_date" type="date" className="input w-full" />
        <input name="budget_note" placeholder="הערת תקציב (אופציונלי)" className="input w-full" />
        <textarea name="description" placeholder="פירוט הצורך" className="input w-full" rows={4} />

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'שולח...' : 'שליחת בקשה'}
        </button>
      </form>
    </main>
  )
}
