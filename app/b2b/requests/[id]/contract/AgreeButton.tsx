'use client'
import { useRouter } from 'next/navigation'

export function AgreeButton({ requestId, alreadyAgreed }: { requestId: string; alreadyAgreed: boolean }) {
  const router = useRouter()
  async function agree() {
    const res = await fetch(`/api/b2b/requests/${requestId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'agree' }),
    })
    if (res.ok) router.refresh()
  }
  if (alreadyAgreed) return <p className="text-green-700 font-bold">✓ אישרת את תנאי העסקה</p>
  return <button onClick={agree} className="btn-primary">אני מאשר את תנאי העסקה</button>
}
