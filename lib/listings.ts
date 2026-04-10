export type ListingInput = {
  seller_id: string
  type: 'mamad' | 'migounit' | 'other'
  length_m: number
  width_m: number
  height_m: number
  price: number
  shipping_option: 'seller_ships' | 'platform_ships' | 'pickup_only'
  shipping_price?: number
  condition?: string
  location?: string
  quantity?: number
  description?: string
  photos?: string[]
}

export function validateListing(input: ListingInput) {
  if (!input.type) throw new Error('type is required')
  if (input.length_m == null || input.width_m == null || input.height_m == null)
    throw new Error('dimensions are required')
  if (input.price == null) throw new Error('price is required')
  if (input.price < 0) throw new Error('price must be positive')
  if (!input.shipping_option) throw new Error('shipping_option is required')
}
