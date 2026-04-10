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

export function ListingCard({ listing }: { listing: Listing }) {
  const typeLabel =
    { mamad: 'ממד', migounit: 'מיגונית', other: 'אחר' }[listing.type] ?? listing.type
  const shippingLabel =
    {
      seller_ships: 'משלוח מהמוכר',
      platform_ships: 'משלוח דרך האתר',
      pickup_only: 'איסוף עצמי',
    }[listing.shipping_option] ?? ''

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
    >
      {listing.photos?.[0] && (
        <img
          src={listing.photos[0]}
          alt={typeLabel}
          className="w-full h-48 object-cover rounded mb-3"
        />
      )}
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-lg">{typeLabel}</span>
        {listing.profiles?.verified && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">✓ מאומת</span>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-1">
        {listing.length_m}×{listing.width_m}×{listing.height_m} מ'
      </p>
      {listing.location && <p className="text-gray-500 text-sm mb-1">{listing.location}</p>}
      <p className="text-sm text-gray-500 mb-2">{shippingLabel}</p>
      <p className="text-xl font-bold text-blue-700">₪{(listing.price / 100).toLocaleString('he-IL')}</p>
    </Link>
  )
}
