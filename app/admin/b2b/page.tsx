import Link from 'next/link'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminB2BQueue() {
  const rows = await sql`
    SELECT r.*, (SELECT COUNT(*) FROM b2b_quotes q WHERE q.request_id = r.id) AS quote_count
    FROM b2b_requests r ORDER BY r.created_at DESC
  `
  return (
    <main dir="rtl" className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black text-navy-900 mb-6">בקשות רכש B2B</h1>
      <div className="space-y-3">
        {rows.map((r: any) => (
          <Link key={r.id} href={`/admin/b2b/${r.id}`} className="card p-4 flex justify-between hover:shadow-card-hover">
            <div>
              <p className="font-bold">{r.org_name} — {r.shelter_type}</p>
              <p className="text-sm text-gray-500">{r.contact_name} · {r.contact_phone} · כמות {r.quantity ?? '—'}</p>
            </div>
            <div className="text-left">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-100 text-brand-700">{r.status}</span>
              <p className="text-xs text-gray-400 mt-1">{r.quote_count} הצעות</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
