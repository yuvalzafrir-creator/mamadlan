import { anonymizeMessage, anonymizeQuote } from '@/lib/b2b/anonymize'

const rawMessage = {
  id: 'm1', request_id: 'r1', sender_id: 'u1', sender_role: 'seller',
  alias: 'ספק א׳', body: 'שלום', created_at: '2026-06-08',
  sender_name: 'חברת מיגון בע"מ', sender_phone: '050-1234567',
}

describe('anonymizeMessage', () => {
  it('keeps alias, role, body, timestamp', () => {
    const out = anonymizeMessage(rawMessage)
    expect(out.alias).toBe('ספק א׳')
    expect(out.sender_role).toBe('seller')
    expect(out.body).toBe('שלום')
  })
  it('strips sender_id and all PII fields', () => {
    const out = anonymizeMessage(rawMessage) as any
    expect(out.sender_id).toBeUndefined()
    expect(out.sender_name).toBeUndefined()
    expect(out.sender_phone).toBeUndefined()
  })
})

const rawQuote = {
  id: 'q1', request_id: 'r1', seller_id: 'u1', unit_price: 5000000, units: 3,
  delivery_terms: 'עד הבית', lead_time: '30 ימים', notes: '', status: 'approved',
  parent_quote_id: null, countered_by: null, created_at: '2026-06-08',
  seller_name: 'חברת מיגון בע"מ', seller_phone: '050-1234567',
  alias: 'ספק א׳',
}

describe('anonymizeQuote', () => {
  it('keeps commercial terms and alias', () => {
    const out = anonymizeQuote(rawQuote)
    expect(out.unit_price).toBe(5000000)
    expect(out.units).toBe(3)
    expect(out.alias).toBe('ספק א׳')
    expect(out.status).toBe('approved')
  })
  it('strips seller_id and seller PII', () => {
    const out = anonymizeQuote(rawQuote) as any
    expect(out.seller_id).toBeUndefined()
    expect(out.seller_name).toBeUndefined()
    expect(out.seller_phone).toBeUndefined()
  })
})
