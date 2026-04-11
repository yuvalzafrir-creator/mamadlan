import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import Link from 'next/link'

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const isConfigured = supabaseUrl.startsWith('https://') && !supabaseUrl.includes('placeholder')
  let listings: any[] | null = null

  if (isConfigured) {
    const supabase = createServerSupabaseClient()
    let query = supabase
      .from('listings')
      .select('*, profiles!seller_id(name, verified, business_name)')
      .eq('status', 'active')

    if (searchParams.type)     query = query.eq('type', searchParams.type)
    if (searchParams.minPrice) query = query.gte('price', parseInt(searchParams.minPrice) * 100)
    if (searchParams.maxPrice) query = query.lte('price', parseInt(searchParams.maxPrice) * 100)
    if (searchParams.location) query = query.ilike('location', `%${searchParams.location}%`)
    if (searchParams.shipping) query = query.eq('shipping_option', searchParams.shipping)

    const { data } = await query.order('created_at', { ascending: false })
    listings = data
  }

  const activeFilters = ['type', 'minPrice', 'maxPrice', 'location', 'shipping']
    .filter(k => searchParams[k])

  return (
    <main dir="rtl">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-black text-navy-900 mb-1">ממדים ומיגוניות למכירה</h1>
          <p className="text-gray-500">
            {listings?.length != null
              ? `נמצאו ${listings.length} מוצרים`
              : 'חיפוש מוצרים'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Sidebar filters ── */}
          <aside className="lg:w-64 shrink-0">
            <form className="card p-5 space-y-5 sticky top-20">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-navy-900">סינון</h2>
                {activeFilters.length > 0 && (
                  <Link href="/listings" className="text-xs text-brand-600 hover:underline">
                    נקה ({activeFilters.length})
                  </Link>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">סוג מוצר</label>
                <select name="type" defaultValue={searchParams.type ?? ''} className="select text-sm">
                  <option value="">כל הסוגים</option>
                  <option value="mamad">ממ&quot;ד</option>
                  <option value="migounit">מיגונית</option>
                  <option value="other">אחר</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">עיר / אזור</label>
                <input
                  name="location"
                  placeholder="הכנס עיר..."
                  defaultValue={searchParams.location ?? ''}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">טווח מחיר (₪)</label>
                <div className="flex gap-2">
                  <input
                    name="minPrice"
                    placeholder="מינ'"
                    type="number"
                    defaultValue={searchParams.minPrice ?? ''}
                    className="input text-sm w-full"
                  />
                  <input
                    name="maxPrice"
                    placeholder="מקס'"
                    type="number"
                    defaultValue={searchParams.maxPrice ?? ''}
                    className="input text-sm w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">סוג משלוח</label>
                <select name="shipping" defaultValue={searchParams.shipping ?? ''} className="select text-sm">
                  <option value="">כל סוגי המשלוח</option>
                  <option value="seller_ships">משלוח מהמוכר</option>
                  <option value="platform_ships">משלוח דרך האתר</option>
                  <option value="pickup_only">איסוף עצמי</option>
                </select>
              </div>

              <button type="submit" className="btn-primary w-full text-sm">
                חפש
              </button>
            </form>
          </aside>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {!listings?.length ? (
              <div className="text-center py-24 text-gray-400">
                <span className="text-6xl block mb-4">🔍</span>
                <p className="text-xl font-semibold text-navy-700 mb-2">לא נמצאו מוצרים</p>
                <p className="text-sm mb-6">נסה לשנות את הסינון או לחפש באזור אחר</p>
                {activeFilters.length > 0 && (
                  <Link href="/listings" className="btn-secondary inline-flex">
                    נקה סינון
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {listings.map(l => (
                  <ListingCard key={l.id} listing={l as any} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
