import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { validateQuoteInput } from '@/lib/b2b/validation'
import type { QuoteInput } from '@/lib/b2b/types'
import sql from '@/lib/db'

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user || (user as any).role !== 'seller') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body: QuoteInput & { parent_quote_id?: string } = await request.json()
  try {
    validateQuoteInput(body)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
  // Seller must be invited and request must be open.
  const invited = await sql`
    SELECT 1 FROM b2b_request_sellers
    WHERE request_id = ${body.request_id} AND seller_id = ${user.id!} LIMIT 1
  `
  if (invited.length === 0) {
    return NextResponse.json({ error: 'Not invited to this request' }, { status: 403 })
  }
  const reqRows = await sql`SELECT status FROM b2b_requests WHERE id = ${body.request_id} LIMIT 1`
  if (!reqRows[0] || ['closed_won', 'closed_lost', 'cancelled'].includes(reqRows[0].status)) {
    return NextResponse.json({ error: 'Request is closed' }, { status: 400 })
  }
  const rows = await sql`
    INSERT INTO b2b_quotes (
      request_id, seller_id, unit_price, units, delivery_terms, lead_time, notes,
      status, parent_quote_id, countered_by
    ) VALUES (
      ${body.request_id}, ${user.id!}, ${body.unit_price}, ${body.units},
      ${body.delivery_terms ?? null}, ${body.lead_time ?? null}, ${body.notes ?? null},
      'submitted', ${body.parent_quote_id ?? null},
      ${body.parent_quote_id ? 'seller' : null}
    ) RETURNING *
  `
  await sql`
    UPDATE b2b_request_sellers SET status = 'quoted'
    WHERE request_id = ${body.request_id} AND seller_id = ${user.id!}
  `
  return NextResponse.json(rows[0], { status: 201 })
}
