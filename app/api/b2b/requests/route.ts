import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { validateRequestInput } from '@/lib/b2b/validation'
import type { RequestInput } from '@/lib/b2b/types'
import sql from '@/lib/db'

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body: RequestInput = await request.json()
  try {
    validateRequestInput(body)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
  // Ensure the user is flagged as a business buyer.
  await sql`UPDATE users SET is_business = TRUE WHERE id = ${user.id!} AND is_business = FALSE`
  let sellerId: string | null = null
  if (body.listing_id) {
    const lrows = await sql`SELECT seller_id FROM listings WHERE id = ${body.listing_id} LIMIT 1`
    sellerId = lrows[0]?.seller_id ?? null
  }
  const rows = await sql`
    INSERT INTO b2b_requests (
      buyer_id, listing_id, org_name, org_type, contact_name, contact_phone,
      contact_email, need_type, shelter_type, quantity, location, target_date,
      budget_note, description, seller_id, wants_shipping, delivery_address, status
    ) VALUES (
      ${user.id!},
      ${body.listing_id ?? null},
      ${body.org_name ?? null},
      ${body.org_type ?? null},
      ${body.contact_name ?? null},
      ${body.contact_phone ?? null},
      ${body.contact_email ?? user.email ?? null},
      ${body.need_type ?? []},
      ${body.shelter_type ?? null},
      ${body.quantity ?? null},
      ${body.location ?? null},
      ${body.target_date ?? null},
      ${body.budget_note ?? null},
      ${body.description ?? null},
      ${sellerId},
      ${body.wants_shipping ?? false},
      ${body.delivery_address ?? null},
      'new'
    ) RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await sql`
    SELECT * FROM b2b_requests
    WHERE buyer_id = ${user.id!}
    ORDER BY created_at DESC
  `
  return NextResponse.json(rows)
}
