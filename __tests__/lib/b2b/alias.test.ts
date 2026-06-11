import { sellerAlias, aliasFor } from '@/lib/b2b/alias'

describe('sellerAlias', () => {
  it('maps index 0 to ספק א׳', () => {
    expect(sellerAlias(0)).toBe('ספק א׳')
  })
  it('maps index 1 to ספק ב׳', () => {
    expect(sellerAlias(1)).toBe('ספק ב׳')
  })
  it('falls back to numbered alias beyond the alphabet', () => {
    expect(sellerAlias(30)).toBe('ספק 31')
  })
})

describe('aliasFor', () => {
  it('returns קונה for buyer', () => {
    expect(aliasFor('buyer', 0)).toBe('קונה')
  })
  it('returns מתאם for admin', () => {
    expect(aliasFor('admin', 0)).toBe('מתאם')
  })
  it('returns indexed seller alias for seller', () => {
    expect(aliasFor('seller', 1)).toBe('ספק ב׳')
  })
})
