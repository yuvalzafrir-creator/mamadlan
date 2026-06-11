import type { RequestStatus, QuoteStatus } from './types'

const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  new: ['qualifying', 'sourcing', 'quoting', 'seller_confirmed', 'seller_declined', 'cancelled'],
  qualifying: ['sourcing', 'cancelled'],
  sourcing: ['quoting', 'cancelled'],
  quoting: ['presented', 'cancelled'],
  presented: ['closed_won', 'closed_lost', 'cancelled'],
  seller_confirmed: ['pending_admin', 'closed_won', 'closed_lost', 'cancelled'],
  seller_declined: ['closed_lost', 'cancelled'],
  pending_admin: ['closed_won', 'closed_lost', 'cancelled'],
  closed_won: [],
  closed_lost: [],
  cancelled: [],
}

const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  submitted: ['approved', 'rejected'],
  approved: ['accepted', 'rejected', 'countered'],
  rejected: [],
  countered: [],
  accepted: [],
}

export function canTransitionRequest(from: RequestStatus, to: RequestStatus): boolean {
  return REQUEST_TRANSITIONS[from]?.includes(to) ?? false
}

export function canTransitionQuote(from: QuoteStatus, to: QuoteStatus): boolean {
  return QUOTE_TRANSITIONS[from]?.includes(to) ?? false
}
