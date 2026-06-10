'use client'
import { useRouter } from 'next/navigation'

export function SellerConfirmActions({ requestId }: { requestId: string }) {
  const router = useRouter()
  async function act(action: 'confirm' | 'decline') {
    const res = await fetch(`/api/b2b/requests/${requestId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) router.refresh()
  }
  return (
    <div className="card p-4 flex gap-3">
      <button onClick={() => act('confirm')} className="btn-primary">אשר זמינות</button>
      <button onClick={() => act('decline')} className="btn-secondary">לא זמין</button>
    </div>
  )
}
