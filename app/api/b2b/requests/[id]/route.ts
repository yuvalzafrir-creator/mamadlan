import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { canTransitionRequest } from '@/lib/b2b/state'
import type { RequestStatus } from '@/lib/b2b/types'
import sql from '@/lib/db'
import { sendAdminEmail } from '@/lib/email'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user as any).role
  const rows = await sql`SELECT * FROM b2b_requests WHERE id = ${params.id} LIMIT 1`
  const reqRow = rows[0]
  if (!reqRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (role === 'admin') return NextResponse.json(reqRow)
  if (reqRow.buyer_id === user.id) return NextResponse.json(reqRow)
  if (role === 'seller') {
    const invited = await sql`
      SELECT 1 FROM b2b_request_sellers
      WHERE request_id = ${params.id} AND seller_id = ${user.id!} LIMIT 1
    `
    const isListingSeller = reqRow.seller_id === user.id
    if (invited.length > 0 || isListingSeller) {
      // strip buyer PII for sellers
      const { contact_name, contact_phone, contact_email, org_name, ...safe } = reqRow
      void contact_name; void contact_phone; void contact_email; void org_name
      return NextResponse.json(safe)
    }
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user as any).role
  const body = await req.json()

  const rows = await sql`SELECT status, seller_id FROM b2b_requests WHERE id = ${params.id} LIMIT 1`
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const from = rows[0].status as RequestStatus

  // Seller path: the listing's own seller confirms or declines a listing-first request.
  if (role === 'seller' && rows[0].seller_id === user.id && (body.action === 'confirm' || body.action === 'decline')) {
    const to: RequestStatus = body.action === 'confirm' ? 'seller_confirmed' : 'seller_declined'
    if (!canTransitionRequest(from, to)) {
      return NextResponse.json({ error: `Illegal transition ${from} -> ${to}` }, { status: 400 })
    }
    const upd = await sql`
      UPDATE b2b_requests SET
        status = ${to},
        seller_shipping_price = ${body.seller_shipping_price ?? null},
        shipping_proposal_requested = ${body.shipping_proposal_requested ?? false},
        updated_at = NOW()
      WHERE id = ${params.id} RETURNING *
    `
    return NextResponse.json(upd[0])
  }

  // Agreement path: buyer or the listing seller approves the generated contract.
  if (body.action === 'agree') {
    const full = await sql`SELECT * FROM b2b_requests WHERE id = ${params.id} LIMIT 1`
    const r = full[0]
    const isBuyer = r.buyer_id === user.id
    const isSeller = r.seller_id === user.id
    if (!isBuyer && !isSeller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (r.status !== 'seller_confirmed') {
      return NextResponse.json({ error: 'Contract not available in this status' }, { status: 400 })
    }
    const upd = await sql`
      UPDATE b2b_requests SET
        buyer_agreed_at = CASE WHEN ${isBuyer} THEN COALESCE(buyer_agreed_at, NOW()) ELSE buyer_agreed_at END,
        seller_agreed_at = CASE WHEN ${isSeller} THEN COALESCE(seller_agreed_at, NOW()) ELSE seller_agreed_at END,
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `
    let row = upd[0]
    if (row.buyer_agreed_at && row.seller_agreed_at && canTransitionRequest(row.status, 'pending_admin')) {
      const moved = await sql`
        UPDATE b2b_requests SET status = 'pending_admin', updated_at = NOW()
        WHERE id = ${params.id} RETURNING *
      `
      row = moved[0]
      const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mamad-marketplace.vercel.app'
      // org_name is user-controlled — escape before putting it in HTML.
      const safeOrg = String(row.org_name ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      void sendAdminEmail(
        'עסקת B2B ממתינה לאישורך',
        `<div dir="rtl"><p>שני הצדדים אישרו את תנאי העסקה:</p>
         <p><b>${safeOrg}</b> — כמות ${Number(row.quantity) || '?'}</p>
         <p><a href="${base}/admin/b2b/${params.id}">לצפייה וסגירת העסקה</a></p></div>`
      )
    }
    return NextResponse.json(row)
  }

  // Admin path: status changes + close (deal_value, commission, shipping).
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (body.status) {
    const to = body.status as RequestStatus
    if (!canTransitionRequest(from, to)) {
      return NextResponse.json({ error: `Illegal transition ${from} -> ${to}` }, { status: 400 })
    }
  }
  const updated = await sql`
    UPDATE b2b_requests SET
      status = ${body.status ?? rows[0].status},
      deal_value = COALESCE(${body.deal_value ?? null}, deal_value),
      commission_amount = COALESCE(${body.commission_amount ?? null}, commission_amount),
      shipping_amount = COALESCE(${body.shipping_amount ?? null}, shipping_amount),
      updated_at = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `
  return NextResponse.json(updated[0])
}
