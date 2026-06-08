import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import sql from '@/lib/db'

const VALID = ['pending_payment', 'paid', 'shipped', 'delivered', 'cancelled']

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try { await requireRole('admin') } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { status } = await request.json()
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const rows = await sql`UPDATE orders SET status = ${status} WHERE id = ${params.id} RETURNING id, status`
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(rows[0])
}
