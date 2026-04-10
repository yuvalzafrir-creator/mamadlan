import { validateListing } from '@/lib/listings'

const validListing = {
  seller_id: 'seller-uuid',
  type: 'mamad' as const,
  length_m: 3.2,
  width_m: 2.5,
  height_m: 2.4,
  price: 5000000,
  shipping_option: 'seller_ships' as const,
}

describe('validateListing', () => {
  it('passes for valid listing', () => {
    expect(() => validateListing(validListing)).not.toThrow()
  })

  it('throws when type is missing', () => {
    expect(() => validateListing({ ...validListing, type: undefined as any }))
      .toThrow('type is required')
  })

  it('throws when price is negative', () => {
    expect(() => validateListing({ ...validListing, price: -1 }))
      .toThrow('price must be positive')
  })

  it('throws when dimensions are missing', () => {
    expect(() => validateListing({ ...validListing, length_m: undefined as any }))
      .toThrow('dimensions are required')
  })

  it('throws when shipping_option is missing', () => {
    expect(() => validateListing({ ...validListing, shipping_option: undefined as any }))
      .toThrow('shipping_option is required')
  })
})
