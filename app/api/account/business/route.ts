import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import sql from '@/lib/db'

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const rows = await sql`
    UPDATE users SET
      is_business = TRUE,
      business_name = ${body.org_name ?? null},
      org_type = ${body.org_type ?? null},
      contact_name = ${body.contact_name ?? null},
      phone = ${body.contact_phone ?? null}
    WHERE id = ${user.id!}
    RETURNING id, is_business, business_name, org_type, contact_name, phone
  `
  return NextResponse.json(rows[0])
}
