import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = { mamad: 'ממד', migounit: 'מיגונית', other: 'אחר' }
const SHIPPING_LABELS: Record<string, string> = {
  seller_ships: 'המוכר מסדר משלוח',
  platform_ships: 'האתר מסדר משלוח',
  pickup_only: 'איסוף עצמי בלבד',
}
const CONDITION_LABELS: Record<string, string> = {
  new: 'חדש',
  used: 'משומש',
  refurbished: 'משופץ',
}

export default async function ListingPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles!seller_id(name, verified, business_name, phone)')
    .eq('id', params.id)
    .single()

  if (!listing) notFound()

  const seller = listing.profiles as any

  return (
    <main className="max-w-3xl mx-auto p-6" dir="rtl">
      {listing.photos?.[0] && (
        <img
          src={listing.photos[0]}
          alt={TYPE_LABELS[listing.type] ?? listing.type}
          className="w-full h-72 object-cover rounded-lg mb-6"
        />
      )}

      <div className="flex justify-between items-start mb-4">
        <h1 className="text-3xl font-bold">{TYPE_LABELS[listing.type] ?? listing.type}</h1>
        {seller?.verified && (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
            ✓ מוכר מאומת
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-blue-700 mb-4">
        ₪{(listing.price / 100).toLocaleString('he-IL')}
      </p>

      <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded p-4 mb-6 text-sm">
        <div>
          <span className="text-gray-500">מידות</span>
          <p className="font-medium">
            {listing.length_m}×{listing.width_m}×{listing.height_m} מ'
          </p>
        </div>
        {listing.condition && (
          <div>
            <span className="text-gray-500">מצב</span>
            <p className="font-medium">{CONDITION_LABELS[listing.condition] ?? listing.condition}</p>
          </div>
        )}
        {listing.location && (
          <div>
            <span className="text-gray-500">מיקום</span>
            <p className="font-medium">{listing.location}</p>
          </div>
        )}
        <div>
          <span className="text-gray-500">משלוח</span>
          <p className="font-medium">{SHIPPING_LABELS[listing.shipping_option] ?? listing.shipping_option}</p>
        </div>
        {listing.quantity && listing.quantity > 1 && (
          <div>
            <span className="text-gray-500">כמות זמינה</span>
            <p className="font-medium">{listing.quantity}</p>
          </div>
        )}
      </div>

      {listing.description && (
        <p className="text-gray-700 mb-6">{listing.description}</p>
      )}

      <div className="border rounded p-4 mb-6">
        <p className="font-semibold">{seller?.business_name ?? seller?.name}</p>
        {seller?.phone && <p className="text-gray-500 text-sm">{seller.phone}</p>}
      </div>

      <Link
        href={`/checkout/${listing.id}`}
        className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold"
      >
        לרכישה
      </Link>
    </main>
  )
}
