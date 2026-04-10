import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('listings')
    .select('*, profiles!seller_id(name, verified, business_name)')
    .eq('status', 'active')

  if (searchParams.type) query = query.eq('type', searchParams.type)
  if (searchParams.minPrice)
    query = query.gte('price', parseInt(searchParams.minPrice) * 100)
  if (searchParams.maxPrice)
    query = query.lte('price', parseInt(searchParams.maxPrice) * 100)
  if (searchParams.location)
    query = query.ilike('location', `%${searchParams.location}%`)
  if (searchParams.shipping)
    query = query.eq('shipping_option', searchParams.shipping)

  const { data: listings } = await query.order('created_at', { ascending: false })

  return (
    <main className="max-w-6xl mx-auto p-6" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">ממדים ומיגוניות למכירה</h1>

      <form className="flex flex-wrap gap-3 mb-8 bg-gray-50 p-4 rounded">
        <select name="type" defaultValue={searchParams.type ?? ''} className="border rounded p-2">
          <option value="">כל הסוגים</option>
          <option value="mamad">ממד</option>
          <option value="migounit">מיגונית</option>
          <option value="other">אחר</option>
        </select>
        <input
          name="location"
          placeholder="עיר / אזור"
          defaultValue={searchParams.location ?? ''}
          className="border rounded p-2"
        />
        <input
          name="minPrice"
          placeholder="מחיר מינימום (₪)"
          type="number"
          defaultValue={searchParams.minPrice ?? ''}
          className="border rounded p-2 w-36"
        />
        <input
          name="maxPrice"
          placeholder="מחיר מקסימום (₪)"
          type="number"
          defaultValue={searchParams.maxPrice ?? ''}
          className="border rounded p-2 w-36"
        />
        <select
          name="shipping"
          defaultValue={searchParams.shipping ?? ''}
          className="border rounded p-2"
        >
          <option value="">כל סוגי המשלוח</option>
          <option value="seller_ships">משלוח מהמוכר</option>
          <option value="platform_ships">משלוח דרך האתר</option>
          <option value="pickup_only">איסוף עצמי</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          סנן
        </button>
      </form>

      {!listings?.length && (
        <p className="text-gray-500">לא נמצאו מוצרים תואמים.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings?.map(l => (
          <ListingCard key={l.id} listing={l as any} />
        ))}
      </div>
    </main>
  )
}
