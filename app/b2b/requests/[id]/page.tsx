import { getSessionUser } from '@/lib/auth'
import { anonymizeQuote } from '@/lib/b2b/anonymize'
import { sellerAlias } from '@/lib/b2b/alias'
import { QuoteThread } from '@/components/b2b/QuoteThread'
import { BuyerQuoteActions } from './BuyerQuoteActions'
import sql from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BuyerRequestDetail({ params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return <main dir="rtl" className="p-12">יש להתחבר</main>
  const reqRows = await sql`SELECT * FROM b2b_requests WHERE id = ${params.id} AND buyer_id = ${user.id!} LIMIT 1`
  const request = reqRows[0]
  if (!request) return <main dir="rtl" className="p-12">בקשה לא נמצאה</main>

  // Only approved/accepted quotes are visible to the buyer, with seller alias.
  const quoteRows = await sql`
    SELECT q.*, rs_idx.idx FROM b2b_quotes q
    JOIN (
      SELECT seller_id, ROW_NUMBER() OVER (ORDER BY invited_at ASC) - 1 AS idx
      FROM b2b_request_sellers WHERE request_id = ${params.id}
    ) rs_idx ON rs_idx.seller_id = q.seller_id
    WHERE q.request_id = ${params.id} AND q.status IN ('approved', 'accepted')
    ORDER BY q.created_at DESC
  `
  const quotes = quoteRows.map((q: any) => ({
    ...anonymizeQuote({ ...q, alias: sellerAlias(q.idx) }),
  }))

  return (
    <main dir="rtl" className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-navy-900">{request.org_name} — {request.shelter_type}</h1>
        <p className="text-gray-500">כמות: {request.quantity ?? '—'} · {request.location ?? ''}</p>
      </div>
      {['seller_confirmed', 'pending_admin', 'closed_won'].includes(request.status) && (
        <Link href={`/b2b/requests/${params.id}/contract`} className="btn-secondary inline-flex">להסכם העסקה ←</Link>
      )}

      <section>
        <h2 className="section-title mb-3">הצעות מחיר</h2>
        {quotes.length === 0 ? <p className="text-gray-400">אין הצעות זמינות עדיין</p> : (
          <div className="space-y-3">
            {quotes.map((q: any) => (
              <div key={q.id} className="card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{q.alias}</p>
                    <p className="text-sm text-gray-600">מחיר ליחידה: ₪{q.unit_price.toLocaleString()} · יחידות: {q.units}</p>
                    {q.delivery_terms && <p className="text-sm text-gray-500">אספקה: {q.delivery_terms}</p>}
                    {q.lead_time && <p className="text-sm text-gray-500">זמן אספקה: {q.lead_time}</p>}
                  </div>
                  {q.status === 'accepted'
                    ? <span className="text-green-700 font-bold text-sm">התקבלה ✓</span>
                    : <BuyerQuoteActions quoteId={q.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <QuoteThread requestId={params.id} />
    </main>
  )
}
