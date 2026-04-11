import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { BuyerWelcomeModal } from '@/components/onboarding/BuyerWelcomeModal'

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const isConfigured = supabaseUrl.startsWith('https://') && !supabaseUrl.includes('placeholder')
  let featured: any[] | null = null
  if (isConfigured) {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('listings')
      .select('*, profiles!seller_id(name, verified, business_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6)
    featured = data
  }

  return (
    <main dir="rtl">
      <BuyerWelcomeModal />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-hero-gradient text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse-slow" />
            שוק יד שנייה לממ&quot;דים ומיגוניות בישראל
          </div>

          <h1 className="text-5xl sm:text-6xl font-black mb-6 leading-tight animate-slide-up">
            ממדים ומיגוניות
            <br />
            <span className="text-amber-400">למכירה</span>
          </h1>

          <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto animate-slide-up">
            רכשו מבני מיגון מעסקים שסיימו את השימוש בהם — במחירים נוחים ועם ביטחון מלא.
          </p>

          {/* Search bar */}
          <form action="/listings" className="flex max-w-xl mx-auto gap-2 animate-slide-up">
            <input
              name="location"
              placeholder="חפש לפי עיר או אזור..."
              className="flex-1 px-5 py-3.5 rounded-xl text-navy-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-base shadow-glass"
            />
            <button
              type="submit"
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-navy-900 font-bold rounded-xl transition-colors shadow-glass whitespace-nowrap"
            >
              חפש
            </button>
          </form>

          {/* Quick filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-4 animate-fade-in">
            {[
              { label: 'ממ"ד', href: '/listings?type=mamad' },
              { label: 'מיגונית', href: '/listings?type=migounit' },
              { label: 'איסוף עצמי', href: '/listings?shipping=pickup_only' },
              { label: 'משלוח כלול', href: '/listings?shipping=platform_ships' },
            ].map(q => (
              <Link
                key={q.href}
                href={q.href}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-sm transition-colors"
              >
                {q.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-3 gap-4 text-center">
          {[
            { value: '100+', label: 'מוצרים פעילים' },
            { value: '50+',  label: 'מוכרים מאומתים' },
            { value: '98%',  label: 'שביעות רצון' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-black text-brand-600">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured listings ── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-brand-600 mb-1">מה יש לנו?</p>
            <h2 className="section-title">מוצרים אחרונים</h2>
          </div>
          <Link href="/listings" className="btn-secondary text-sm">
            הצג הכל ←
          </Link>
        </div>

        {featured?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(l => <ListingCard key={l.id} listing={l as any} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <span className="text-5xl block mb-4">🏗️</span>
            <p className="text-lg font-medium">עדיין אין מוצרים</p>
            <p className="text-sm mt-1">היה הראשון לפרסם ממ&quot;ד או מיגונית</p>
            <Link href="/seller/register" className="btn-primary mt-4 inline-flex">הרשמה כמוכר</Link>
          </div>
        )}
      </section>

      {/* ── How it works ── */}
      <section className="bg-navy-900 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-semibold text-brand-400 mb-2 text-center">פשוט ובטוח</p>
          <h2 className="text-3xl font-black text-center mb-12">איך זה עובד?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
            {[
              { n: '01', icon: '🔍', title: 'חפש', body: 'סנן לפי סוג, מחיר ואזור' },
              { n: '02', icon: '✅', title: 'בחר', body: 'קרא פרטים ובדוק מוכר מאומת' },
              { n: '03', icon: '💳', title: 'שלם', body: 'תשלום מאובטח דרך Stripe' },
              { n: '04', icon: '🚛', title: 'קבל', body: 'משלוח עד הבית או איסוף' },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
                  {s.icon}
                </div>
                <p className="text-xs text-navy-400 font-mono mb-1">{s.n}</p>
                <h3 className="font-bold text-lg mb-1">{s.title}</h3>
                <p className="text-sm text-navy-300">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust badges ── */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title text-center mb-10">למה לקנות אצלנו?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '🛡️', title: 'מוכרים מאומתים', body: 'כל מוכר עובר תהליך אימות מקיף לפני קבלת תג הוורידקציה.' },
              { icon: '💳', title: 'תשלום מאובטח',   body: 'כל עסקה מאובטחת דרך Stripe עם הגנת קונה מובנית.' },
              { icon: '🚚', title: 'אפשרויות משלוח', body: 'משלוח מהמוכר, דרך האתר, או איסוף עצמי — כרצונך.' },
            ].map(t => (
              <div key={t.title} className="card p-6 text-center hover:shadow-card-hover transition-shadow">
                <div className="text-4xl mb-4">{t.icon}</div>
                <h3 className="font-bold text-lg mb-2 text-navy-900">{t.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seller CTA ── */}
      <section className="bg-gradient-to-r from-brand-600 to-brand-700 text-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">יש לך ממ&quot;ד לא בשימוש?</h2>
          <p className="text-blue-100 text-lg mb-8">
            הצטרף לעשרות עסקים שכבר מוכרים דרכנו. הליך הרשמה פשוט, תשלומים מאובטחים.
          </p>
          <Link
            href="/seller/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-glass text-lg"
          >
            התחל למכור עכשיו ←
          </Link>
        </div>
      </section>
    </main>
  )
}
