'use client'
import { useState } from 'react'

const STATUSES = [
  { value: 'pending_payment', label: 'ממתין לתשלום' },
  { value: 'paid',            label: 'שולם' },
  { value: 'shipped',         label: 'נשלח' },
  { value: 'delivered',       label: 'נמסר' },
  { value: 'cancelled',       label: 'בוטל' },
]

const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-700',
  paid:            'bg-green-100 text-green-700',
  shipped:         'bg-blue-100 text-blue-700',
  delivered:       'bg-emerald-100 text-emerald-700',
  cancelled:       'bg-red-100 text-red-700',
}

export default function AdminOrderStatus({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)

  async function update(newStatus: string) {
    setSaving(true)
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setStatus(newStatus)
    setSaving(false)
  }

  return (
    <select
      value={status}
      onChange={e => update(e.target.value)}
      disabled={saving}
      className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer disabled:opacity-60 ${STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {STATUSES.map(s => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  )
}
