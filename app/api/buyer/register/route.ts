import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db'

export async function POST(request: NextRequest) {
  const { email, password, name, phone } = await request.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, 12)
  await sql`
    INSERT INTO users (email, password_hash, role, name, phone)
    VALUES (${email}, ${password_hash}, 'buyer', ${name ?? null}, ${phone ?? null})
  `

  return NextResponse.json({ success: true }, { status: 201 })
}
