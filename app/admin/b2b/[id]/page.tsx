import { QuoteThread } from '@/components/b2b/QuoteThread'
import { AdminRequestActions } from './AdminRequestActions'
import { DealProgressBar } from '@/components/b2b/DealProgressBar'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminB2BDetail({ params }: { params: { id: string } }) {
  const reqRows = await sql`SELECT * FROM b2b_requests WHERE id = ${params.id} LIMIT 1`
  const request = reqRows[0]
  if (!request) return <main dir="rtl" className="p-12">לא נמצא</main>

  const quotes = await sql`
    SELECT q.*, u.business_name, u.name FROM b2b_quotes q
    JOIN users u ON u.id = q.seller_id
    WHERE q.request_id = ${params.id} ORDER BY q.created_at DESC
  `
  const verifiedSellers = await sql`
    SELECT id, business_name, name FROM users WHERE role = 'seller' AND verified = TRUE
  `
  const shortlisted = await sql`SELECT seller_id FROM b2b_request_sellers WHERE request_id = ${params.id}`

  return (
    <main dir="rtl" className="max-w-4xl mx-auto px-6 py-12 space-y-6">
      <div className="card p-4">
        <h1 className="text-2xl font-black">{request.org_name}</h1>
        <p className="text-gray-600">{request.contact_name} · {request.contact_phone} · {request.contact_email}</p>
        <p className="text-gray-600">סוג: {request.shelter_type} · כמות: {request.quantity ?? '—'} · אזור: {request.location ?? '—'}</p>
        <p className="text-gray-600">צורך: {(request.need_type ?? []).join(', ')}</p>
        {request.wants_shipping && (
          <p className="text-gray-600">משלוח התבקש{request.delivery_address ? ` — ${request.delivery_address}` : ''}</p>
        )}
        <p className="text-gray-600">סטטוס: {request.status}</p>
        {request.description && <p className="text-gray-700 mt-2">{request.description}</p>}
      </div>

      <DealProgressBar status={request.status} />

      <AdminRequestActions
        requestId={request.id}
        status={request.status}
        sellers={verifiedSellers as any}
        shortlisted={(shortlisted as any).map((s: any) => s.seller_id)}
        quotes={quotes as any}
      />

      <QuoteThread requestId={params.id} />
    </main>
  )
}
