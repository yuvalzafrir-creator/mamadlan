import { canTransitionRequest, canTransitionQuote } from '@/lib/b2b/state'

describe('canTransitionRequest', () => {
  it('allows new -> qualifying', () => {
    expect(canTransitionRequest('new', 'qualifying')).toBe(true)
  })
  it('allows quoting -> presented', () => {
    expect(canTransitionRequest('quoting', 'presented')).toBe(true)
  })
  it('allows presented -> closed_won', () => {
    expect(canTransitionRequest('presented', 'closed_won')).toBe(true)
  })
  it('allows any non-closed -> cancelled', () => {
    expect(canTransitionRequest('quoting', 'cancelled')).toBe(true)
  })
  it('forbids closed_won -> quoting', () => {
    expect(canTransitionRequest('closed_won', 'quoting')).toBe(false)
  })
  it('forbids new -> closed_won (skipping)', () => {
    expect(canTransitionRequest('new', 'closed_won')).toBe(false)
  })
})

describe('canTransitionQuote', () => {
  it('allows submitted -> approved', () => {
    expect(canTransitionQuote('submitted', 'approved')).toBe(true)
  })
  it('allows submitted -> rejected', () => {
    expect(canTransitionQuote('submitted', 'rejected')).toBe(true)
  })
  it('allows approved -> accepted', () => {
    expect(canTransitionQuote('approved', 'accepted')).toBe(true)
  })
  it('allows approved -> countered', () => {
    expect(canTransitionQuote('approved', 'countered')).toBe(true)
  })
  it('forbids rejected -> accepted', () => {
    expect(canTransitionQuote('rejected', 'accepted')).toBe(false)
  })
  it('forbids accepted -> rejected', () => {
    expect(canTransitionQuote('accepted', 'rejected')).toBe(false)
  })
})
