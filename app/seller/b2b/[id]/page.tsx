import { getSessionUser } from '@/lib/auth'
import { QuoteThread } from '@/components/b2b/QuoteThread'
import { SellerQuoteForm } from './SellerQuoteForm'
import { SellerConfirmActions } from './SellerConfirmActions'
import { DealProgressBar } from '@/components/b2b/DealProgressBar'
import sql from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SellerB2BDetail({ params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return <main dir="rtl" className="p-12">יש להתחבר</main>
  const access = await sql`
    SELECT
      (SELECT COUNT(*) FROM b2b_request_sellers WHERE request_id = ${params.id} AND seller_id = ${user.id!}) AS invited,
      (SELECT COUNT(*) FROM b2b_requests WHERE id = ${params.id} AND seller_id = ${user.id!}) AS owns
  `
  if (Number(access[0].invited) === 0 && Number(access[0].owns) === 0) {
    return <main dir="rtl" className="p-12">אין גישה</main>
  }

  const reqRows = await sql`SELECT id, shelter_type, quantity, location, target_date, description, status, seller_id, wants_shipping, delivery_address FROM b2b_requests WHERE id = ${params.id} LIMIT 1`
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
      <DealProgressBar status={request.status} />

      {request.seller_id === user.id && (
        <section className="space-y-3">
          {request.wants_shipping && (
            <p className="text-sm text-gray-600">הקונה ביקש משלוח{request.delivery_address ? ` אל: ${request.delivery_address}` : ''}</p>
          )}
          {request.status === 'new'
            ? <SellerConfirmActions requestId={params.id} wantsShipping={!!request.wants_shipping} />
            : <p className="text-sm font-semibold text-navy-900">סטטוס אישור: {request.status}</p>}
          {['seller_confirmed', 'pending_admin', 'closed_won'].includes(request.status) && (
            <Link href={`/b2b/requests/${params.id}/contract`} className="btn-secondary inline-flex">להסכם העסקה ←</Link>
          )}
        </section>
      )}

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
