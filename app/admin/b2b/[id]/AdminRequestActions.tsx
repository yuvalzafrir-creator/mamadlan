'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Seller = { id: string; business_name: string | null; name: string | null }
type Quote = { id: string; business_name: string | null; unit_price: number; units: number; status: string; delivery_terms: string | null }

export function AdminRequestActions({ requestId, status, sellers, shortlisted, quotes }: {
  requestId: string; status: string; sellers: Seller[]; shortlisted: string[]; quotes: Quote[]
}) {
  const router = useRouter()
  const [picked, setPicked] = useState<string[]>([])
  const [dealValue, setDealValue] = useState('')
  const [commission, setCommission] = useState('')
  const [shipping, setShipping] = useState('')

  async function patchStatus(newStatus: string) {
    const res = await fetch(`/api/b2b/requests/${requestId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) router.refresh()
  }
  async function shortlist() {
    const res = await fetch(`/api/b2b/requests/${requestId}/sellers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seller_ids: picked }),
    })
    if (res.ok) { setPicked([]); router.refresh() }
  }
  async function quoteAction(quoteId: string, action: string) {
    const res = await fetch(`/api/b2b/quotes/${quoteId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) router.refresh()
  }
  async function close(won: boolean) {
    const res = await fetch(`/api/b2b/requests/${requestId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: won ? 'closed_won' : 'closed_lost',
        deal_value: won ? Number(dealValue) : null,
        commission_amount: won ? Number(commission) : null,
        shipping_amount: won ? Number(shipping) : null,
      }),
    })
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <p className="font-bold mb-2">סטטוס: {status}</p>
        <div className="flex flex-wrap gap-2">
          {['qualifying', 'sourcing', 'quoting', 'presented'].map(s => (
            <button key={s} onClick={() => patchStatus(s)} className="btn-secondary text-sm">{s}</button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <p className="font-bold mb-2">בחירת ספקים מאומתים</p>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {sellers.map(s => {
            const already = shortlisted.includes(s.id)
            return (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" disabled={already}
                  checked={already || picked.includes(s.id)}
                  onChange={e => setPicked(p => e.target.checked ? [...p, s.id] : p.filter(x => x !== s.id))} />
                {s.business_name || s.name} {already && <span className="text-green-600 text-xs">(הוזמן)</span>}
              </label>
            )
          })}
        </div>
        <button onClick={shortlist} disabled={picked.length === 0} className="btn-primary text-sm mt-3">הזמן להצעה</button>
      </div>

      <div className="card p-4">
        <p className="font-bold mb-2">הצעות מחיר</p>
        {quotes.length === 0 ? <p className="text-gray-400 text-sm">אין הצעות</p> : quotes.map(q => (
          <div key={q.id} className="flex justify-between items-center border-b py-2 text-sm">
            <span>{q.business_name} — ₪{q.unit_price.toLocaleString()} × {q.units} ({q.status})</span>
            {q.status === 'submitted' && (
              <span className="flex gap-2">
                <button onClick={() => quoteAction(q.id, 'approve')} className="text-green-700">אשר</button>
                <button onClick={() => quoteAction(q.id, 'reject')} className="text-red-600">דחה</button>
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="card p-4">
        <p className="font-bold mb-2">סגירת עסקה</p>
        <input value={dealValue} onChange={e => setDealValue(e.target.value)} placeholder="שווי עסקה ₪" className="input w-full mb-2" />
        <input value={commission} onChange={e => setCommission(e.target.value)} placeholder="עמלה ₪" className="input w-full mb-2" />
        <input value={shipping} onChange={e => setShipping(e.target.value)} placeholder="עלות משלוח / שירותים ₪" className="input w-full mb-2" />
        <div className="flex gap-2">
          <button onClick={() => close(true)} className="btn-primary text-sm">סגור כעסקה (won)</button>
          <button onClick={() => close(false)} className="btn-secondary text-sm">סגור ללא עסקה</button>
        </div>
      </div>
    </div>
  )
}
