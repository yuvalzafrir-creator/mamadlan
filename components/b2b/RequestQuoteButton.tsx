'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RequestQuoteButton({ listingId, shelterType, location }: {
  listingId: string; shelterType: string; location: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/b2b/requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        org_name: fd.get('org_name'),
        contact_name: fd.get('contact_name'),
        contact_phone: fd.get('contact_phone'),
        need_type: ['bulk'],
        shelter_type: shelterType,
        location,
        quantity: Number(fd.get('quantity')),
        target_date: fd.get('target_date') || null,
        description: fd.get('description'),
      }),
    })
    if (res.status === 401) { router.push(`/login?next=/listings/${listingId}`); return }
    if (!res.ok) { const j = await res.json(); setError(j.error || 'שגיאה'); return }
    router.push('/b2b/requests')
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="btn-secondary w-full">בקשת הצעת מחיר / הזמנה בכמות</button>
  }
  return (
    <form onSubmit={onSubmit} className="card p-4 space-y-3 mt-3">
      <p className="font-bold">בקשת הצעה לכמות</p>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input name="org_name" required placeholder="שם הארגון" className="input w-full" />
      <input name="contact_name" required placeholder="איש קשר" className="input w-full" />
      <input name="contact_phone" placeholder="טלפון" className="input w-full" />
      <input name="quantity" type="number" min="1" required placeholder="כמות" className="input w-full" />
      <input name="target_date" type="date" className="input w-full" />
      <textarea name="description" placeholder="פירוט" className="input w-full" rows={2} />
      <button type="submit" className="btn-primary w-full">שליחה</button>
    </form>
  )
}
