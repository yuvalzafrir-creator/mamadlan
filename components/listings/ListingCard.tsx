import Link from 'next/link'

type Listing = {
  id: string
  type: string
  length_m: number
  width_m: number
  height_m: number
  price: number
  location?: string
  shipping_option: string
  photos?: string[]
  profiles?: { name: string; verified: boolean; business_name: string }
}

const TYPE_LABELS: Record<string, string> = { mamad: 'ממד', migounit: 'מיגונית', other: 'אחר' }
const TYPE_COLORS: Record<string, string> = {
  mamad:    'bg-brand-600',
  migounit: 'bg-amber-500',
  other:    'bg-navy-600',
}
const SHIPPING_ICONS: Record<string, string> = {
  seller_ships:   '🚛',
  platform_ships: '📦',
  pickup_only:    '🤝',
}
const SHIPPING_LABELS: Record<string, string> = {
  seller_ships:   'משלוח מהמוכר',
  platform_ships: 'משלוח דרך האתר',
  pickup_only:    'איסוף עצמי',
}

export function ListingCard({ listing }: { listing: Listing }) {
  const typeLabel     = TYPE_LABELS[listing.type]     ?? listing.type
  const typeBg        = TYPE_COLORS[listing.type]     ?? 'bg-navy-600'
  const shippingIcon  = SHIPPING_ICONS[listing.shipping_option]  ?? '📦'
  const shippingLabel = SHIPPING_LABELS[listing.shipping_option] ?? ''
  const priceILS      = (listing.price / 100).toLocaleString('he-IL')
  const dims          = `${listing.length_m}×${listing.width_m}×${listing.height_m} מ'`

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col"
    >
      {/* Image / placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-navy-100 to-brand-100 overflow-hidden">
        {listing.photos?.[0] ? (
          <img
            src={listing.photos[0]}
            alt={typeLabel}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-20">🏗️</span>
          </div>
        )}

        {/* Type badge overlay */}
        <div className={`absolute top-3 right-3 ${typeBg} text-white text-xs font-bold px-2.5 py-1 rounded-lg`}>
          {typeLabel}
        </div>

        {/* Verified badge */}
        {listing.profiles?.verified && (
          <div className="absolute top-3 left-3 badge-verified">
            ✓ מאומת
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Seller name */}
        <p className="text-xs text-gray-500 font-medium truncate">
          {listing.profiles?.business_name ?? listing.profiles?.name ?? ''}
        </p>

        {/* Dimensions */}
        <p className="text-sm font-semibold text-navy-700">{dims}</p>

        {/* Location */}
        {listing.location && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            📍 {listing.location}
          </p>
        )}

        <div className="flex-1" />

        {/* Footer row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <p className="text-lg font-black text-brand-600">₪{priceILS}</p>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            {shippingIcon} {shippingLabel}
          </span>
        </div>
      </div>
    </Link>
  )
}
