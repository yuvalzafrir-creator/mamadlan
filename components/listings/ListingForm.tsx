'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ListingFormProps = { initialData?: any; listingId?: string }

export function ListingForm({ initialData, listingId }: ListingFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    type: initialData?.type ?? 'migounit',
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
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialData?.images?.length ? initialData.images : ['']
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function setImage(index: number, value: string) {
    setImageUrls(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function addImageSlot() {
    if (imageUrls.length < 4) setImageUrls(prev => [...prev, ''])
  }

  function removeImage(index: number) {
    setImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const images = imageUrls.filter(u => u.trim())
    const payload = {
      ...form,
      length_m: parseFloat(form.length_m),
      width_m: parseFloat(form.width_m),
      height_m: parseFloat(form.height_m),
      price: Math.round(parseFloat(form.price) * 100),
      shipping_price: form.shipping_price ? Math.round(parseFloat(form.shipping_price) * 100) : null,
      quantity: parseInt(form.quantity),
      images,
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
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-navy-900">
            {listingId ? 'עדכון מוצר' : 'פרסום מוצר חדש'}
          </h1>
          <p className="text-gray-500 mt-1">מלא את הפרטים — המוצר יפורסם מיד לאחר השמירה.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Type */}
          <div className="card p-6">
            <h2 className="font-bold text-navy-900 mb-4">סוג מוצר</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'migounit', label: 'מיגונית', icon: '🏗️', sub: 'מבנה מיגון נייד' },
                { value: 'other', label: 'אחר', icon: '📦', sub: 'סוג אחר' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                    form.type === opt.value
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" name="type" value={opt.value} checked={form.type === opt.value}
                    onChange={set('type')} className="sr-only" />
                  <div className="text-3xl mb-1">{opt.icon}</div>
                  <div className="font-bold text-sm text-navy-900">{opt.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{opt.sub}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Dimensions & price */}
          <div className="card p-6">
            <h2 className="font-bold text-navy-900 mb-4">מידות ומחיר</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { field: 'length_m', label: 'אורך (מ\')' },
                { field: 'width_m', label: 'רוחב (מ\')' },
                { field: 'height_m', label: 'גובה (מ\')' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-navy-700 mb-1.5">{label} *</label>
                  <input type="number" step="0.01" min="0" value={(form as any)[field]}
                    onChange={set(field)} className="input" required />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700 mb-1.5">מחיר (₪) *</label>
              <input type="number" step="1" min="0" value={form.price} onChange={set('price')}
                placeholder="15000" className="input" required />
            </div>
          </div>

          {/* Shipping */}
          <div className="card p-6">
            <h2 className="font-bold text-navy-900 mb-4">משלוח</h2>
            <div>
              <label className="block text-sm font-semibold text-navy-700 mb-1.5">אפשרות משלוח *</label>
              <select value={form.shipping_option} onChange={set('shipping_option')} className="input">
                <option value="seller_ships">המוכר מסדר משלוח</option>
                <option value="platform_ships">האתר מסדר משלוח</option>
                <option value="pickup_only">איסוף עצמי בלבד</option>
              </select>
            </div>
            {form.shipping_option === 'seller_ships' && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-navy-700 mb-1.5">מחיר משלוח (₪)</label>
                <input type="number" step="1" min="0" value={form.shipping_price}
                  onChange={set('shipping_price')} placeholder="0" className="input" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="card p-6">
            <h2 className="font-bold text-navy-900 mb-4">פרטים נוספים</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1.5">מצב</label>
                <select value={form.condition} onChange={set('condition')} className="input">
                  <option value="">לא צוין</option>
                  <option value="new">חדש</option>
                  <option value="used">משומש</option>
                  <option value="refurbished">משופץ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1.5">עיר / אזור</label>
                <input value={form.location} onChange={set('location')} placeholder="תל אביב" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1.5">כמות</label>
                <input type="number" min="1" value={form.quantity} onChange={set('quantity')} className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1.5">תיאור</label>
                <textarea value={form.description} onChange={set('description')} rows={4}
                  placeholder="תאר את המוצר — מידות מדויקות, מצב, היסטוריה, כל מה שהקונה צריך לדעת."
                  className="input resize-none" />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="card p-6">
            <h2 className="font-bold text-navy-900 mb-1">תמונות</h2>
            <p className="text-sm text-gray-400 mb-4">הדבק קישורים לתמונות (עד 4). מומלץ להשתמש ב-Imgur, Google Drive, או תמונות ציבוריות.</p>
            <div className="space-y-3">
              {imageUrls.map((url, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center">
                    {url ? (
                      <img src={url} alt="" className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <span className="text-gray-300 text-lg">🖼</span>
                    )}
                  </div>
                  <input
                    value={url}
                    onChange={e => setImage(i, e.target.value)}
                    placeholder={`קישור לתמונה ${i + 1}...`}
                    className="input flex-1"
                    dir="ltr"
                  />
                  {imageUrls.length > 1 && (
                    <button type="button" onClick={() => removeImage(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1">✕</button>
                  )}
                </div>
              ))}
            </div>
            {imageUrls.length < 4 && (
              <button type="button" onClick={addImageSlot}
                className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-semibold transition-colors">
                + הוסף תמונה נוספת
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base justify-center">
            {loading ? 'שומר...' : listingId ? 'שמור שינויים' : 'פרסם מוצר ←'}
          </button>
        </form>
      </div>
    </div>
  )
}
