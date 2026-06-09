import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  new: 'התקבלה', qualifying: 'בבדיקה', sourcing: 'באיתור ספקים',
  quoting: 'באיסוף הצעות', presented: 'הצעות זמינות',
  closed_won: 'נסגרה', closed_lost: 'בוטלה', cancelled: 'בוטלה',
}

export default async function BuyerRequestsPage() {
  const user = await getSessionUser()
  if (!user) return <main dir="rtl" className="p-12">יש להתחבר</main>
  const rows = await sql`
    SELECT * FROM b2b_requests WHERE buyer_id = ${user.id!} ORDER BY created_at DESC
  `
  return (
    <main dir="rtl" className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black text-navy-900 mb-6">בקשות הרכש שלי</h1>
      {rows.length === 0 ? (
        <p className="text-gray-500">אין בקשות עדיין. <Link href="/b2b/request" className="text-brand-600">שלחו בקשה</Link></p>
      ) : (
        <div className="space-y-3">
          {rows.map((r: any) => (
            <Link key={r.id} href={`/b2b/requests/${r.id}`} className="card p-4 flex justify-between items-center hover:shadow-card-hover">
              <div>
                <p className="font-bold text-navy-900">{r.org_name} — {r.shelter_type}</p>
                <p className="text-sm text-gray-500">כמות: {r.quantity ?? '—'} · {r.location ?? ''}</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-100 text-brand-700">
                {STATUS_LABELS[r.status] ?? r.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
