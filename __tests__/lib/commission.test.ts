import { calculateCommission, calculateTotal } from '@/lib/commission'

describe('calculateCommission', () => {
  it('calculates 10% commission on item price', () => {
    expect(calculateCommission(100000, 10)).toBe(10000)
  })

  it('rounds down to nearest integer', () => {
    expect(calculateCommission(100001, 10)).toBe(10000)
  })

  it('returns 0 for 0% commission rate', () => {
    expect(calculateCommission(100000, 0)).toBe(0)
  })
})

describe('calculateTotal', () => {
  it('sums item price and shipping', () => {
    expect(calculateTotal(100000, 20000)).toBe(120000)
  })

  it('handles zero shipping', () => {
    expect(calculateTotal(100000, 0)).toBe(100000)
  })
})
