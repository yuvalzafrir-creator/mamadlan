'use client'
import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useParams, useRouter } from 'next/navigation'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError('')
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
      },
    })
    if (error) {
      setError(error.message ?? 'תשלום נכשל')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
      >
        {loading ? 'מעבד...' : 'שלם עכשיו'}
      </button>
    </form>
  )
}

type Listing = {
  id: string
  type: string
  length_m: number
  width_m: number
  height_m: number
  price: number
  shipping_option: string
  shipping_price?: number
}

export default function CheckoutPage() {
  const params = useParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [selectedShipping, setSelectedShipping] = useState('pickup')
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/listings/${params.listing_id}`)
      .then(r => r.json())
      .then(l => {
        setListing(l)
        // Default shipping selection based on listing option
        if (l.shipping_option === 'seller_ships') setSelectedShipping('seller')
        else if (l.shipping_option === 'platform_ships') setSelectedShipping('platform')
        else setSelectedShipping('pickup')
      })
  }, [params.listing_id])

  async function proceedToPayment() {
    setError('')
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: params.listing_id, shipping_type: selectedShipping }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setClientSecret(data.clientSecret)
    setOrderId(data.orderId)
    setStep('payment')
  }

  if (!listing) return <div className="p-6 text-center">טוען...</div>

  const typeLabel =
    { mamad: 'ממד', migounit: 'מיגונית', other: 'אחר' }[listing.type] ?? listing.type

  return (
    <main className="max-w-lg mx-auto p-6 mt-10" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">תשלום</h1>

      <div className="bg-gray-50 rounded p-4 mb-6">
        <p className="font-medium">
          {typeLabel} — {listing.length_m}×{listing.width_m}×{listing.height_m} מ'
        </p>
        <p className="text-xl font-bold text-blue-700">
          ₪{(listing.price / 100).toLocaleString('he-IL')}
        </p>
      </div>

      {step === 'shipping' && (
        <div className="space-y-4">
          <h2 className="font-semibold">בחר אפשרות משלוח</h2>

          {listing.shipping_option === 'seller_ships' && (
            <label className="flex items-center gap-3 border rounded p-3 cursor-pointer">
              <input
                type="radio"
                name="shipping"
                value="seller"
                checked={selectedShipping === 'seller'}
                onChange={() => setSelectedShipping('seller')}
              />
              <span>
                משלוח מהמוכר
                {listing.shipping_price
                  ? ` — ₪${(listing.shipping_price / 100).toLocaleString('he-IL')}`
                  : ''}
              </span>
            </label>
          )}

          {listing.shipping_option === 'platform_ships' && (
            <label className="flex items-center gap-3 border rounded p-3 cursor-pointer">
              <input
                type="radio"
                name="shipping"
                value="platform"
                checked={selectedShipping === 'platform'}
                onChange={() => setSelectedShipping('platform')}
              />
              <span>משלוח דרך האתר</span>
            </label>
          )}

          <label className="flex items-center gap-3 border rounded p-3 cursor-pointer">
            <input
              type="radio"
              name="shipping"
              value="pickup"
              checked={selectedShipping === 'pickup'}
              onChange={() => setSelectedShipping('pickup')}
            />
            <span>איסוף עצמי — ללא תשלום משלוח</span>
          </label>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={proceedToPayment}
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            המשך לתשלום
          </button>
        </div>
      )}

      {step === 'payment' && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} />
        </Elements>
      )}
    </main>
  )
}
