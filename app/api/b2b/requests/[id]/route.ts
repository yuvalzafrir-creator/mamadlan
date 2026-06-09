import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { canTransitionRequest } from '@/lib/b2b/state'
import type { RequestStatus } from '@/lib/b2b/types'
import sql from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user as any).role
  const rows = await sql`SELECT * FROM b2b_requests WHERE id = ${params.id} LIMIT 1`
  const reqRow = rows[0]
  if (!reqRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (role === 'admin') return NextResponse.json(reqRow)
  if (reqRow.buyer_id === user.id) return NextResponse.json(reqRow)
  // sellers: only if invited
  const invited = await sql`
    SELECT 1 FROM b2b_request_sellers
    WHERE request_id = ${params.id} AND seller_id = ${user.id!} LIMIT 1
  `
  if (role === 'seller' && invited.length > 0) {
    // strip buyer PII for sellers
    const { contact_name, contact_phone, contact_email, org_name, ...safe } = reqRow
    void contact_name; void contact_phone; void contact_email; void org_name
    return NextResponse.json(safe)
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user || (user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const rows = await sql`SELECT status FROM b2b_requests WHERE id = ${params.id} LIMIT 1`
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.status) {
    const from = rows[0].status as RequestStatus
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
      updated_at = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `
  return NextResponse.json(updated[0])
}
