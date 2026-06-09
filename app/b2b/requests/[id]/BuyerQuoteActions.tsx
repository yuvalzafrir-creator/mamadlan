'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BuyerQuoteActions({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const [countering, setCountering] = useState(false)

  async function act(action: string, counter?: any) {
    const res = await fetch(`/api/b2b/quotes/${quoteId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, counter }),
    })
    if (res.ok) router.refresh()
  }

  if (countering) {
    return (
      <form onSubmit={e => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        act('counter', { unit_price: Number(fd.get('unit_price')), units: Number(fd.get('units')) })
      }} className="flex flex-col gap-2">
        <input name="unit_price" type="number" required placeholder="מחיר נגדי ₪" className="input" />
        <input name="units" type="number" required defaultValue={1} placeholder="יחידות" className="input" />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary text-sm">שלח הצעה נגדית</button>
          <button type="button" onClick={() => setCountering(false)} className="btn-secondary text-sm">ביטול</button>
        </div>
      </form>
    )
  }
  return (
    <div className="flex gap-2">
      <button onClick={() => act('accept')} className="btn-primary text-sm">קבל</button>
      <button onClick={() => setCountering(true)} className="btn-secondary text-sm">הצעה נגדית</button>
      <button onClick={() => act('reject')} className="btn-secondary text-sm">דחה</button>
    </div>
  )
}
