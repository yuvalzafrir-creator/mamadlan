import sql from '@/lib/db'
import { ListingCard } from '@/components/listings/ListingCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const { type, minPrice, maxPrice, location, shipping, q, minArea, maxArea, condition, sort } = searchParams

  const orderBy =
    sort === 'price_asc'  ? sql`ORDER BY l.price ASC`
  : sort === 'price_desc' ? sql`ORDER BY l.price DESC`
  : sql`ORDER BY l.created_at DESC`

  const listings = await sql`
    SELECT l.*, u.name as seller_name, u.verified as seller_verified, u.business_name as seller_business_name
    FROM listings l JOIN users u ON u.id = l.seller_id
    WHERE l.status = 'active'
    ${type ? sql`AND l.type = ${type}` : sql``}
    ${minPrice ? sql`AND l.price >= ${parseInt(minPrice) * 100}` : sql``}
    ${maxPrice ? sql`AND l.price <= ${parseInt(maxPrice) * 100}` : sql``}
    ${location ? sql`AND l.location ILIKE ${'%' + location + '%'}` : sql``}
    ${shipping ? sql`AND l.shipping_option = ${shipping}` : sql``}
    ${q ? sql`AND (l.title ILIKE ${'%' + q + '%'} OR l.description ILIKE ${'%' + q + '%'} OR l.location ILIKE ${'%' + q + '%'})` : sql``}
    ${minArea ? sql`AND l.area >= ${parseInt(minArea)}` : sql``}
    ${maxArea ? sql`AND l.area <= ${parseInt(maxArea)}` : sql``}
    ${condition ? sql`AND l.condition = ${condition}` : sql``}
    ${orderBy}
  `

  const activeFilters = ['type', 'minPrice', 'maxPrice', 'location', 'shipping', 'q', 'minArea', 'maxArea', 'condition'].filter(k => searchParams[k])

  return (
    <main dir="rtl">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-black text-navy-900 mb-1">ממדים ומיגוניות למכירה</h1>
          <p className="text-gray-500">נמצאו {listings.length} מוצרים</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
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
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">חיפוש חופשי</label>
                <input name="q" placeholder="חפש לפי כותרת, תיאור, אזור..." defaultValue={q ?? ''} className="input text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">סוג מוצר</label>
                <select name="type" defaultValue={type ?? ''} className="select text-sm">
                  <option value="">כל הסוגים</option>
                  <option value="mamad">ממ&quot;ד</option>
                  <option value="migounit">מיגונית</option>
                  <option value="other">אחר</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">עיר / אזור</label>
                <input name="location" placeholder="הכנס עיר..." defaultValue={location ?? ''} className="input text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">טווח מחיר (₪)</label>
                <div className="flex gap-2">
                  <input name="minPrice" placeholder="מינ'" type="number" defaultValue={minPrice ?? ''} className="input text-sm w-full" />
                  <input name="maxPrice" placeholder="מקס'" type="number" defaultValue={maxPrice ?? ''} className="input text-sm w-full" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">שטח (מ&quot;ר)</label>
                <div className="flex gap-2">
                  <input name="minArea" placeholder="מינ'" type="number" defaultValue={minArea ?? ''} className="input text-sm w-full" />
                  <input name="maxArea" placeholder="מקס'" type="number" defaultValue={maxArea ?? ''} className="input text-sm w-full" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">מצב</label>
                <select name="condition" defaultValue={condition ?? ''} className="select text-sm">
                  <option value="">כל המצבים</option>
                  <option value="new">חדש</option>
                  <option value="used">משומש</option>
                  <option value="refurbished">משופץ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">סוג משלוח</label>
                <select name="shipping" defaultValue={shipping ?? ''} className="select text-sm">
                  <option value="">כל סוגי המשלוח</option>
                  <option value="seller_ships">משלוח מהמוכר</option>
                  <option value="platform_ships">משלוח דרך האתר</option>
                  <option value="pickup_only">איסוף עצמי</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">מיון</label>
                <select name="sort" defaultValue={sort ?? 'newest'} className="select text-sm">
                  <option value="newest">החדשים ביותר</option>
                  <option value="price_asc">מחיר: מהנמוך לגבוה</option>
                  <option value="price_desc">מחיר: מהגבוה לנמוך</option>
                </select>
              </div>

              <button type="submit" className="btn-primary w-full text-sm">חפש</button>
            </form>
          </aside>

          <div className="flex-1 min-w-0">
            {listings.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                <span className="text-6xl block mb-4">🔍</span>
                <p className="text-xl font-semibold text-navy-700 mb-2">לא נמצאו מוצרים</p>
                <p className="text-sm mb-6">נסה לשנות את הסינון או לחפש באזור אחר</p>
                {activeFilters.length > 0 && (
                  <Link href="/listings" className="btn-secondary inline-flex">נקה סינון</Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {listings.map((l: any) => <ListingCard key={l.id} listing={l} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
