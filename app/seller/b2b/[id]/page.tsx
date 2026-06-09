import { getSessionUser } from '@/lib/auth'
import { QuoteThread } from '@/components/b2b/QuoteThread'
import { SellerQuoteForm } from './SellerQuoteForm'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function SellerB2BDetail({ params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return <main dir="rtl" className="p-12">יש להתחבר</main>
  const invited = await sql`SELECT 1 FROM b2b_request_sellers WHERE request_id = ${params.id} AND seller_id = ${user.id!} LIMIT 1`
  if (invited.length === 0) return <main dir="rtl" className="p-12">אין גישה</main>

  const reqRows = await sql`SELECT id, shelter_type, quantity, location, target_date, description, status FROM b2b_requests WHERE id = ${params.id} LIMIT 1`
  const request = reqRows[0]
  const myQuotes = await sql`
    SELECT * FROM b2b_quotes WHERE request_id = ${params.id} AND seller_id = ${user.id!} ORDER BY created_at DESC
  `
  const closed = ['closed_won', 'closed_lost', 'cancelled'].includes(request.status)

  return (
    <main dir="rtl" className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div className="card p-4">
        <h1 className="text-2xl font-black">בקשה: {request.shelter_type}</h1>
        <p className="text-gray-600">כמות: {request.quantity ?? '—'} · אזור: {request.location ?? '—'}</p>
        {request.description && <p className="text-gray-700 mt-2">{request.description}</p>}
      </div>

      <section>
        <h2 className="section-title mb-3">ההצעות שלי</h2>
        {myQuotes.map((q: any) => (
          <div key={q.id} className="card p-3 mb-2 text-sm">
            ₪{q.unit_price.toLocaleString()} × {q.units} — {q.status}
            {q.countered_by === 'buyer' && q.status === 'submitted' && <span className="text-amber-600"> (הצעה נגדית מהקונה — נדרש מענה)</span>}
            {!closed && q.countered_by === 'buyer' && q.status === 'submitted' && (
              <div className="mt-3"><SellerQuoteForm requestId={params.id} parentQuoteId={q.id} /></div>
            )}
          </div>
        ))}
        {!closed && <SellerQuoteForm requestId={params.id} />}
        {closed && <p className="text-gray-400">הבקשה נסגרה</p>}
      </section>

      <QuoteThread requestId={params.id} />
    </main>
  )
}
