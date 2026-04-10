import { calculateSellerPayout } from '@/lib/stripe-helpers'

describe('calculateSellerPayout', () => {
  it('subtracts commission, adds shipping when seller ships', () => {
    expect(calculateSellerPayout(100000, 10000, 20000, 'seller')).toBe(110000)
  })

  it('seller gets no shipping when platform ships', () => {
    expect(calculateSellerPayout(100000, 10000, 20000, 'platform')).toBe(90000)
  })

  it('seller gets full item minus commission for pickup', () => {
    expect(calculateSellerPayout(100000, 10000, 0, 'pickup')).toBe(90000)
  })
})
