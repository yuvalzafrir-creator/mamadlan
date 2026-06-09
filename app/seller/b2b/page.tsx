import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function SellerB2BList() {
  const user = await getSessionUser()
  if (!user) return <main dir="rtl" className="p-12">יש להתחבר</main>
  const rows = await sql`
    SELECT r.id, r.shelter_type, r.quantity, r.location, r.target_date, r.status, rs.status AS invite_status
    FROM b2b_request_sellers rs JOIN b2b_requests r ON r.id = rs.request_id
    WHERE rs.seller_id = ${user.id!} ORDER BY rs.invited_at DESC
  `
  return (
    <main dir="rtl" className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black text-navy-900 mb-6">בקשות הצעת מחיר</h1>
      {rows.length === 0 ? <p className="text-gray-500">אין בקשות כרגע</p> : (
        <div className="space-y-3">
          {rows.map((r: any) => (
            <Link key={r.id} href={`/seller/b2b/${r.id}`} className="card p-4 flex justify-between hover:shadow-card-hover">
              <div>
                <p className="font-bold">{r.shelter_type} · כמות {r.quantity ?? '—'}</p>
                <p className="text-sm text-gray-500">{r.location ?? ''} {r.target_date ? `· עד ${r.target_date}` : ''}</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-100 text-brand-700">{r.invite_status}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
