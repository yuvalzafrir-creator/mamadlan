export type OrgType = 'company' | 'municipality' | 'other'
export type NeedType = 'bulk' | 'sourcing' | 'po_deal' | 'custom'
export type ShelterType = 'mamad' | 'migounit' | 'other' | 'any'

export type RequestStatus =
  | 'new' | 'qualifying' | 'sourcing' | 'quoting'
  | 'presented' | 'closed_won' | 'closed_lost' | 'cancelled'

export type QuoteStatus =
  | 'submitted' | 'approved' | 'rejected' | 'countered' | 'accepted'

export type SenderRole = 'buyer' | 'seller' | 'admin'

export type RequestInput = {
  listing_id?: string | null
  org_name?: string
  org_type?: OrgType
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  need_type?: NeedType[]
  shelter_type?: ShelterType
  quantity?: number
  location?: string
  target_date?: string | null
  budget_note?: string
  description?: string
}

export type QuoteInput = {
  request_id: string
  unit_price: number
  units: number
  delivery_terms?: string
  lead_time?: string
  notes?: string
}
