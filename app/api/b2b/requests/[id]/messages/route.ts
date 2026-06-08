import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { aliasFor } from '@/lib/b2b/alias'
import { anonymizeMessage } from '@/lib/b2b/anonymize'
import type { SenderRole } from '@/lib/b2b/types'
import sql from '@/lib/db'

// Resolve this user's role + stable seller index for the request.
async function resolveSender(requestId: string, userId: string, role: string) {
  if (role === 'admin') return { senderRole: 'admin' as SenderRole, index: 0 }
  const reqRows = await sql`SELECT buyer_id FROM b2b_requests WHERE id = ${requestId} LIMIT 1`
  if (reqRows[0]?.buyer_id === userId) return { senderRole: 'buyer' as SenderRole, index: 0 }
  // seller index = position in invited-order
  const sellers = await sql`
    SELECT seller_id FROM b2b_request_sellers
    WHERE request_id = ${requestId} ORDER BY invited_at ASC
  `
  const idx = sellers.findIndex((s: any) => s.seller_id === userId)
  if (idx >= 0) return { senderRole: 'seller' as SenderRole, index: idx }
  return null
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user as any).role
  const sender = await resolveSender(params.id, user.id!, role)
  if (!sender) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rows = await sql`
    SELECT * FROM b2b_messages WHERE request_id = ${params.id} ORDER BY created_at ASC
  `
  if (role === 'admin') return NextResponse.json(rows) // admin sees raw rows
  return NextResponse.json(rows.map(anonymizeMessage))
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user as any).role
  const sender = await resolveSender(params.id, user.id!, role)
  if (!sender) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json() as { body: string }
  if (!body.body?.trim()) return NextResponse.json({ error: 'body is required' }, { status: 400 })

  const alias = aliasFor(sender.senderRole, sender.index)
  const rows = await sql`
    INSERT INTO b2b_messages (request_id, sender_id, sender_role, alias, body)
    VALUES (${params.id}, ${user.id!}, ${sender.senderRole}, ${alias}, ${body.body})
    RETURNING *
  `
  return NextResponse.json(anonymizeMessage(rows[0]), { status: 201 })
}
