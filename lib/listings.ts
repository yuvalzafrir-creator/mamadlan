export type ListingInput = {
  title?: string
  type: 'migounit' | 'other'
  price: number
  shipping_option: 'seller_ships' | 'platform_ships' | 'pickup_only' | 'none'
  shipping_price?: number
  condition?: string
  location?: string
  area?: number
  floor?: number
  length_m?: number
  width_m?: number
  height_m?: number
  quantity?: number
  description?: string
  images?: string[]
}

export function validateListing(input: ListingInput) {
  if (!input.type) throw new Error('type is required')
  // A mamad is a structural reinforced room — it cannot be dismantled and resold.
  if ((input.type as string) === 'mamad') throw new Error('mamad cannot be resold')
  if (input.price == null) throw new Error('price is required')
  if (input.price < 0) throw new Error('price must be positive')
  if (!input.shipping_option) throw new Error('shipping_option is required')
}
