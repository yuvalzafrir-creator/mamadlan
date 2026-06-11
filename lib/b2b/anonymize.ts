export function anonymizeMessage(row: any) {
  return {
    id: row.id,
    request_id: row.request_id,
    sender_role: row.sender_role,
    alias: row.alias,
    body: row.body,
    created_at: row.created_at,
  }
}

export function anonymizeQuote(row: any) {
  return {
    id: row.id,
    request_id: row.request_id,
    alias: row.alias,
    unit_price: row.unit_price,
    units: row.units,
    delivery_terms: row.delivery_terms,
    lead_time: row.lead_time,
    notes: row.notes,
    status: row.status,
    parent_quote_id: row.parent_quote_id,
    countered_by: row.countered_by,
    created_at: row.created_at,
  }
}
