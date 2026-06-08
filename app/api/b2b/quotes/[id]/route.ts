import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { canTransitionQuote } from '@/lib/b2b/state'
import type { QuoteStatus } from '@/lib/b2b/types'
import sql from '@/lib/db'

// action: 'approve' | 'reject' (admin); 'accept' | 'reject' | 'counter' (buyer)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user as any).role
  const body = await req.json() as { action: string; counter?: any }

  const rows = await sql`SELECT * FROM b2b_quotes WHERE id = ${params.id} LIMIT 1`
  const quote = rows[0]
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const from = quote.status as QuoteStatus

  // Admin: approve / reject submitted quotes
  if (role === 'admin' && (body.action === 'approve' || body.action === 'reject')) {
    const to: QuoteStatus = body.action === 'approve' ? 'approved' : 'rejected'
    if (!canTransitionQuote(from, to)) {
      return NextResponse.json({ error: `Illegal transition ${from} -> ${to}` }, { status: 400 })
    }
    const upd = await sql`UPDATE b2b_quotes SET status = ${to}, updated_at = NOW() WHERE id = ${params.id} RETURNING *`
    if (to === 'approved') {
      await sql`UPDATE b2b_requests SET status = 'presented', updated_at = NOW() WHERE id = ${quote.request_id} AND status = 'quoting'`
    }
    return NextResponse.json(upd[0])
  }

  // Buyer must own the request behind this quote
  const reqRows = await sql`SELECT buyer_id FROM b2b_requests WHERE id = ${quote.request_id} LIMIT 1`
  const isBuyer = role !== 'admin' && reqRows[0]?.buyer_id === user.id

  if (isBuyer && body.action === 'reject') {
    if (!canTransitionQuote(from, 'rejected')) {
      return NextResponse.json({ error: 'Illegal transition' }, { status: 400 })
    }
    const upd = await sql`UPDATE b2b_quotes SET status = 'rejected', updated_at = NOW() WHERE id = ${params.id} RETURNING *`
    return NextResponse.json(upd[0])
  }

  if (isBuyer && body.action === 'accept') {
    if (!canTransitionQuote(from, 'accepted')) {
      return NextResponse.json({ error: 'Illegal transition' }, { status: 400 })
    }
    const upd = await sql`UPDATE b2b_quotes SET status = 'accepted', updated_at = NOW() WHERE id = ${params.id} RETURNING *`
    // reject all other approved quotes on this request
    await sql`
      UPDATE b2b_quotes SET status = 'rejected', updated_at = NOW()
      WHERE request_id = ${quote.request_id} AND id <> ${params.id} AND status = 'approved'
    `
    return NextResponse.json(upd[0])
  }

  if (isBuyer && body.action === 'counter') {
    if (!canTransitionQuote(from, 'countered')) {
      return NextResponse.json({ error: 'Illegal transition' }, { status: 400 })
    }
    await sql`UPDATE b2b_quotes SET status = 'countered', updated_at = NOW() WHERE id = ${params.id}`
    const child = await sql`
      INSERT INTO b2b_quotes (
        request_id, seller_id, unit_price, units, delivery_terms, lead_time, notes,
        status, parent_quote_id, countered_by
      ) VALUES (
        ${quote.request_id}, ${quote.seller_id},
        ${body.counter?.unit_price ?? quote.unit_price},
        ${body.counter?.units ?? quote.units},
        ${body.counter?.delivery_terms ?? quote.delivery_terms},
        ${body.counter?.lead_time ?? quote.lead_time},
        ${body.counter?.notes ?? null},
        'submitted', ${params.id}, 'buyer'
      ) RETURNING *
    `
    return NextResponse.json(child[0], { status: 201 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
