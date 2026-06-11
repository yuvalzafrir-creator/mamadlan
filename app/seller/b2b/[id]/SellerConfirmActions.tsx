'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SellerConfirmActions({ requestId, wantsShipping }: { requestId: string; wantsShipping: boolean }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [askAdmin, setAskAdmin] = useState(false)
  const [price, setPrice] = useState('')

  async function send(payload: any) {
    const res = await fetch(`/api/b2b/requests/${requestId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) router.refresh()
  }

  if (confirming && wantsShipping) {
    return (
      <form onSubmit={e => {
        e.preventDefault()
        send({
          action: 'confirm',
          seller_shipping_price: askAdmin ? null : Number(price),
          shipping_proposal_requested: askAdmin,
        })
      }} className="card p-4 space-y-3">
        <p className="font-bold">אישור זמינות — תמחור משלוח</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={askAdmin} onChange={e => setAskAdmin(e.target.checked)} />
          בקש הצעת משלוח מהמנהל
        </label>
        {!askAdmin && (
          <input value={price} onChange={e => setPrice(e.target.value)} type="number" required
            placeholder="מחיר משלוח ₪" className="input w-full" />
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary text-sm">אשר זמינות</button>
          <button type="button" onClick={() => setConfirming(false)} className="btn-secondary text-sm">ביטול</button>
        </div>
      </form>
    )
  }

  return (
    <div className="card p-4 flex gap-3">
      <button
        onClick={() => (wantsShipping ? setConfirming(true) : send({ action: 'confirm' }))}
        className="btn-primary">אשר זמינות</button>
      <button onClick={() => send({ action: 'decline' })} className="btn-secondary">לא זמין</button>
    </div>
  )
}
