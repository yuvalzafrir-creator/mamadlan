'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SellerQuoteForm({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/b2b/quotes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: requestId,
        unit_price: Number(fd.get('unit_price')),
        units: Number(fd.get('units')),
        delivery_terms: fd.get('delivery_terms'),
        lead_time: fd.get('lead_time'),
        notes: fd.get('notes'),
      }),
    })
    if (!res.ok) { const j = await res.json(); setError(j.error || 'שגיאה'); return }
    ;(e.target as HTMLFormElement).reset()
    router.refresh()
  }
  return (
    <form onSubmit={onSubmit} className="card p-4 space-y-3">
      <p className="font-bold">הגשת הצעת מחיר</p>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input name="unit_price" type="number" required placeholder="מחיר ליחידה ₪" className="input w-full" />
      <input name="units" type="number" required defaultValue={1} placeholder="יחידות" className="input w-full" />
      <input name="delivery_terms" placeholder="תנאי אספקה" className="input w-full" />
      <input name="lead_time" placeholder="זמן אספקה" className="input w-full" />
      <textarea name="notes" placeholder="הערות" className="input w-full" rows={2} />
      <button type="submit" className="btn-primary w-full">שלח הצעה</button>
    </form>
  )
}
