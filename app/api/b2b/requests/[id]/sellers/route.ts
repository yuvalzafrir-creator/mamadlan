import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import sql from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user || (user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json() as { seller_ids: string[] }
  for (const sellerId of body.seller_ids ?? []) {
    await sql`
      INSERT INTO b2b_request_sellers (request_id, seller_id, status)
      VALUES (${params.id}, ${sellerId}, 'invited')
      ON CONFLICT (request_id, seller_id) DO NOTHING
    `
  }
  // advance request to quoting if still earlier
  await sql`
    UPDATE b2b_requests SET status = 'quoting', updated_at = NOW()
    WHERE id = ${params.id} AND status IN ('new', 'qualifying', 'sourcing')
  `
  const rows = await sql`
    SELECT rs.*, u.business_name, u.name
    FROM b2b_request_sellers rs JOIN users u ON u.id = rs.seller_id
    WHERE rs.request_id = ${params.id}
  `
  return NextResponse.json(rows)
}
