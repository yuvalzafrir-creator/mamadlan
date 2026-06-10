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
  it('allows new -> seller_confirmed', () => {
    expect(canTransitionRequest('new', 'seller_confirmed')).toBe(true)
  })
  it('allows new -> seller_declined', () => {
    expect(canTransitionRequest('new', 'seller_declined')).toBe(true)
  })
  it('allows seller_confirmed -> closed_won', () => {
    expect(canTransitionRequest('seller_confirmed', 'closed_won')).toBe(true)
  })
  it('allows seller_declined -> closed_lost', () => {
    expect(canTransitionRequest('seller_declined', 'closed_lost')).toBe(true)
  })
  it('forbids seller_declined -> seller_confirmed', () => {
    expect(canTransitionRequest('seller_declined', 'seller_confirmed')).toBe(false)
  })
  it('forbids closed_won -> seller_confirmed', () => {
    expect(canTransitionRequest('closed_won', 'seller_confirmed')).toBe(false)
  })
  it('allows seller_confirmed -> pending_admin', () => {
    expect(canTransitionRequest('seller_confirmed', 'pending_admin')).toBe(true)
  })
  it('allows pending_admin -> closed_won', () => {
    expect(canTransitionRequest('pending_admin', 'closed_won')).toBe(true)
  })
  it('allows pending_admin -> closed_lost', () => {
    expect(canTransitionRequest('pending_admin', 'closed_lost')).toBe(true)
  })
  it('forbids new -> pending_admin (must pass seller confirmation)', () => {
    expect(canTransitionRequest('new', 'pending_admin')).toBe(false)
  })
  it('forbids pending_admin -> seller_confirmed (no going back)', () => {
    expect(canTransitionRequest('pending_admin', 'seller_confirmed')).toBe(false)
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
