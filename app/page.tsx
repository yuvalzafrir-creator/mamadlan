import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { BuyerWelcomeModal } from '@/components/onboarding/BuyerWelcomeModal'

export default async function HomePage() {
  const supabase = createServerSupabaseClient()
  const { data: featured } = await supabase
    .from('listings')
    .select('*, profiles!seller_id(name, verified, business_name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <main dir="rtl">
      <BuyerWelcomeModal />

      <section className="bg-blue-700 text-white py-20 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">ממדים ומיגוניות למכירה</h1>
        <p className="text-xl mb-8 text-blue-100">שוק יד שנייה לממ&quot;דים ומיגוניות במחירים נוחים</p>
        <form action="/listings" className="flex max-w-lg mx-auto gap-2">
          <input
            name="location"
            placeholder="חפש לפי עיר..."
            className="flex-1 rounded-lg px-4 py-3 text-gray-800"
          />
          <button type="submit" className="bg-white text-blue-700 font-bold px-6 py-3 rounded-lg">
            חפש
          </button>
        </form>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6">מוצרים אחרונים</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured?.map(l => <ListingCard key={l.id} listing={l as any} />)}
        </div>
        <div className="text-center mt-8">
          <Link href="/listings" className="bg-blue-600 text-white px-8 py-3 rounded-lg inline-block">
            כל המוצרים
          </Link>
        </div>
      </section>

      <section className="bg-gray-50 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl mb-2">🛡️</div>
            <h3 className="font-bold mb-1">מוכרים מאומתים</h3>
            <p className="text-gray-500 text-sm">מוכרים עוברים תהליך אימות</p>
          </div>
          <div>
            <div className="text-3xl mb-2">💳</div>
            <h3 className="font-bold mb-1">תשלום מאובטח</h3>
            <p className="text-gray-500 text-sm">עסקאות מוגנות דרך Stripe</p>
          </div>
          <div>
            <div className="text-3xl mb-2">🚚</div>
            <h3 className="font-bold mb-1">אפשרויות משלוח</h3>
            <p className="text-gray-500 text-sm">משלוח מהמוכר, מהאתר, או איסוף</p>
          </div>
        </div>
      </section>
    </main>
  )
}
