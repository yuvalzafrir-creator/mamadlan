import type { RequestInput, QuoteInput } from './types'

export function validateRequestInput(input: RequestInput) {
  if (!input.org_name) throw new Error('org_name is required')
  if (!input.contact_name) throw new Error('contact_name is required')
  if (!input.need_type || input.need_type.length === 0) throw new Error('need_type is required')
  if (!input.shelter_type) throw new Error('shelter_type is required')
  // A mamad is a structural reinforced room — it cannot be dismantled and resold.
  if ((input.shelter_type as string) === 'mamad') throw new Error('mamad cannot be resold')
}

export function validateQuoteInput(input: QuoteInput) {
  if (!input.request_id) throw new Error('request_id is required')
  if (input.unit_price == null || input.unit_price <= 0) throw new Error('unit_price must be positive')
  if (input.units == null || input.units < 1) throw new Error('units must be at least 1')
}
