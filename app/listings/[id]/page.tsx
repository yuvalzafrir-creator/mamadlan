import sql from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RequestQuoteButton } from '@/components/b2b/RequestQuoteButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TYPE_LABELS: Record<string, string>      = { mamad: 'ממ"ד', migounit: 'מיגונית', other: 'אחר' }
const SHIPPING_LABELS: Record<string, string>  = {
  seller_ships:   'המוכר מסדר משלוח',
  platform_ships: 'האתר מסדר משלוח',
  pickup_only:    'איסוף עצמי בלבד',
}
const CONDITION_LABELS: Record<string, string> = { new: 'חדש', used: 'משומש', refurbished: 'משופץ' }

export default async function ListingPage({ params }: { params: { id: string } }) {
  const rows = await sql`
    SELECT l.*, u.name as seller_name, u.verified as seller_verified, u.business_name as seller_business_name, u.phone as seller_phone
    FROM listings l JOIN users u ON u.id = l.seller_id
    WHERE l.id = ${params.id}
  `
  const listing = rows[0]
  if (!listing) notFound()

  const typeLabel = TYPE_LABELS[listing.type] ?? listing.type
  const priceILS  = (listing.price / 100).toLocaleString('he-IL')

  return (
    <main dir="rtl" className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-navy-900 transition-colors">בית</Link>
          <span>/</span>
          <Link href="/listings" className="hover:text-navy-900 transition-colors">מוצרים</Link>
          <span>/</span>
          <span className="text-navy-900 font-medium">{typeLabel}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="card overflow-hidden">
              {listing.images?.[0] ? (
                <img src={listing.images[0]} alt={typeLabel} className="w-full h-80 object-cover" />
              ) : (
                <div className="w-full h-80 bg-gradient-to-br from-navy-100 to-brand-100 flex items-center justify-center">
                  <span className="text-8xl opacity-20">🏗️</span>
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="font-bold text-navy-900 mb-4">פרטי המוצר</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">סוג</p>
                  <p className="font-semibold text-navy-900">{typeLabel}</p>
                </div>
                {listing.length_m && listing.width_m && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">מידות (א×ר×ג מ&apos;)</p>
                    <p className="font-semibold text-navy-900">{listing.length_m}×{listing.width_m}{listing.height_m ? `×${listing.height_m}` : ''}</p>
                  </div>
                )}
                {listing.area && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">שטח</p>
                    <p className="font-semibold text-navy-900">{listing.area} מ&apos;</p>
                  </div>
                )}
                {listing.condition && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">מצב</p>
                    <p className="font-semibold text-navy-900">{CONDITION_LABELS[listing.condition] ?? listing.condition}</p>
                  </div>
                )}
                {listing.location && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">מיקום</p>
                    <p className="font-semibold text-navy-900">{listing.location}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">משלוח</p>
                  <p className="font-semibold text-navy-900">{SHIPPING_LABELS[listing.shipping_option] ?? listing.shipping_option}</p>
                </div>
              </div>

              {listing.description && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">תיאור</p>
                  <p className="text-gray-700 leading-relaxed">{listing.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="card p-6 sticky top-20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-3xl font-black text-brand-600">₪{priceILS}</p>
                  {listing.shipping_price && listing.shipping_option === 'seller_ships' && (
                    <p className="text-xs text-gray-400 mt-1">
                      + ₪{(listing.shipping_price / 100).toLocaleString('he-IL')} משלוח
                    </p>
                  )}
                </div>
                {listing.seller_verified && <span className="badge-verified">✓ מאומת</span>}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-400 mb-0.5">המוכר</p>
                <p className="font-bold text-navy-900">{listing.seller_business_name ?? listing.seller_name}</p>
                {listing.seller_phone && <p className="text-sm text-gray-500 mt-0.5">{listing.seller_phone}</p>}
              </div>

              <ul className="space-y-2 mb-5 text-sm text-gray-500">
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> תשלום מאובטח דרך Stripe</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> הגנת קונה מובנית</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> תמיכה בעברית</li>
              </ul>

              <Link href={`/checkout/${listing.id}`} className="btn-primary w-full text-base py-3.5 justify-center">
                לרכישה מאובטחת ←
              </Link>
              <RequestQuoteButton listingId={listing.id} shelterType={listing.type} location={listing.location} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
