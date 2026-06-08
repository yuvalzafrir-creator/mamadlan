import { validateRequestInput, validateQuoteInput } from '@/lib/b2b/validation'

const validRequest = {
  org_name: 'עיריית חיפה',
  contact_name: 'דנה',
  contact_phone: '050-0000000',
  need_type: ['bulk' as const],
  shelter_type: 'migounit' as const,
}

describe('validateRequestInput', () => {
  it('passes for a valid request', () => {
    expect(() => validateRequestInput(validRequest)).not.toThrow()
  })
  it('throws when org_name missing', () => {
    expect(() => validateRequestInput({ ...validRequest, org_name: '' }))
      .toThrow('org_name is required')
  })
  it('throws when contact_name missing', () => {
    expect(() => validateRequestInput({ ...validRequest, contact_name: '' }))
      .toThrow('contact_name is required')
  })
  it('throws when need_type empty', () => {
    expect(() => validateRequestInput({ ...validRequest, need_type: [] }))
      .toThrow('need_type is required')
  })
  it('throws when shelter_type missing', () => {
    expect(() => validateRequestInput({ ...validRequest, shelter_type: undefined as any }))
      .toThrow('shelter_type is required')
  })
})

const validQuote = { request_id: 'r1', unit_price: 5000000, units: 3 }

describe('validateQuoteInput', () => {
  it('passes for a valid quote', () => {
    expect(() => validateQuoteInput(validQuote)).not.toThrow()
  })
  it('throws when unit_price <= 0', () => {
    expect(() => validateQuoteInput({ ...validQuote, unit_price: 0 }))
      .toThrow('unit_price must be positive')
  })
  it('throws when units < 1', () => {
    expect(() => validateQuoteInput({ ...validQuote, units: 0 }))
      .toThrow('units must be at least 1')
  })
  it('throws when request_id missing', () => {
    expect(() => validateQuoteInput({ ...validQuote, request_id: '' }))
      .toThrow('request_id is required')
  })
})
