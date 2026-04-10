'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ListingFormProps = { initialData?: any; listingId?: string }

export function ListingForm({ initialData, listingId }: ListingFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    type: initialData?.type ?? 'mamad',
    length_m: initialData?.length_m?.toString() ?? '',
    width_m: initialData?.width_m?.toString() ?? '',
    height_m: initialData?.height_m?.toString() ?? '',
    price: initialData?.price ? (initialData.price / 100).toString() : '',
    shipping_option: initialData?.shipping_option ?? 'seller_ships',
    shipping_price: initialData?.shipping_price ? (initialData.shipping_price / 100).toString() : '',
    condition: initialData?.condition ?? '',
    location: initialData?.location ?? '',
    quantity: initialData?.quantity?.toString() ?? '1',
    description: initialData?.description ?? '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const payload = {
      ...form,
      length_m: parseFloat(form.length_m),
      width_m: parseFloat(form.width_m),
      height_m: parseFloat(form.height_m),
      price: Math.round(parseFloat(form.price) * 100),
      shipping_price: form.shipping_price ? Math.round(parseFloat(form.shipping_price) * 100) : null,
      quantity: parseInt(form.quantity),
    }
    const url = listingId ? `/api/listings/${listingId}` : '/api/listings'
    const method = listingId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push('/seller/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold">{listingId ? 'עדכון מוצר' : 'מוצר חדש'}</h1>

      <div>
        <label className="block text-sm font-medium mb-1">סוג *</label>
        <select value={form.type} onChange={set('type')} className="w-full border rounded p-2">
          <option value="mamad">ממד</option>
          <option value="migounit">מיגונית</option>
          <option value="other">אחר</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-sm">אורך (מ') *</label>
          <input type="number" step="0.01" value={form.length_m} onChange={set('length_m')}
            className="w-full border rounded p-2" required />
        </div>
        <div>
          <label className="text-sm">רוחב (מ') *</label>
          <input type="number" step="0.01" value={form.width_m} onChange={set('width_m')}
            className="w-full border rounded p-2" required />
        </div>
        <div>
          <label className="text-sm">גובה (מ') *</label>
          <input type="number" step="0.01" value={form.height_m} onChange={set('height_m')}
            className="w-full border rounded p-2" required />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">מחיר (₪) *</label>
        <input type="number" step="0.01" value={form.price} onChange={set('price')}
          className="w-full border rounded p-2" required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">אפשרות משלוח *</label>
        <select value={form.shipping_option} onChange={set('shipping_option')} className="w-full border rounded p-2">
          <option value="seller_ships">המוכר מסדר משלוח</option>
          <option value="platform_ships">האתר מסדר משלוח</option>
          <option value="pickup_only">איסוף עצמי בלבד</option>
        </select>
      </div>

      {form.shipping_option === 'seller_ships' && (
        <div>
          <label className="block text-sm font-medium mb-1">מחיר משלוח (₪)</label>
          <input type="number" step="0.01" value={form.shipping_price} onChange={set('shipping_price')}
            className="w-full border rounded p-2" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">מצב</label>
        <select value={form.condition} onChange={set('condition')} className="w-full border rounded p-2">
          <option value="">לא צוין</option>
          <option value="new">חדש</option>
          <option value="used">משומש</option>
          <option value="refurbished">משופץ</option>
        </select>
      </div>

      <input placeholder="עיר / אזור" value={form.location} onChange={set('location')}
        className="w-full border rounded p-2" />
      <input type="number" placeholder="כמות" value={form.quantity} onChange={set('quantity')}
        min="1" className="w-full border rounded p-2" />
      <textarea placeholder="תיאור" value={form.description} onChange={set('description')}
        rows={4} className="w-full border rounded p-2" />

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">
        {loading ? 'שומר...' : listingId ? 'שמור שינויים' : 'פרסם מוצר'}
      </button>
    </form>
  )
}
