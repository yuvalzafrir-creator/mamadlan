'use client'
import { useRouter } from 'next/navigation'

export function BuyerQuoteActions({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  async function act(action: string) {
    const res = await fetch(`/api/b2b/quotes/${quoteId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) router.refresh()
  }
  return (
    <div className="flex gap-2">
      <button onClick={() => act('accept')} className="btn-primary text-sm">קבל</button>
      <button onClick={() => act('reject')} className="btn-secondary text-sm">דחה</button>
    </div>
  )
}
