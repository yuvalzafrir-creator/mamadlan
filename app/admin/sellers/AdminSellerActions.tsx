'use client'
export default function AdminSellerActions({ sellerId }: { sellerId: string }) {
  async function verify(action: 'approve' | 'reject') {
    await fetch(`/api/admin/sellers/${sellerId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    window.location.reload()
  }
  return (
    <div className="flex gap-2">
      <button
        onClick={() => verify('approve')}
        className="bg-green-600 text-white px-3 py-1 rounded text-sm"
      >
        אשר
      </button>
      <button
        onClick={() => verify('reject')}
        className="bg-red-500 text-white px-3 py-1 rounded text-sm"
      >
        דחה
      </button>
    </div>
  )
}
