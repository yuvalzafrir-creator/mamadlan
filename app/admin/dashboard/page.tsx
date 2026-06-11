import Link from 'next/link'
import sql from '@/lib/db'
import { DealProgressBar } from '@/components/b2b/DealProgressBar'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [stats] = await sql`
    SELECT
      (SELECT COALESCE(SUM(commission_amount), 0) FROM b2b_requests WHERE status = 'closed_won') AS b2b_commission,
      (SELECT COALESCE(SUM(shipping_amount), 0) FROM b2b_requests WHERE status = 'closed_won') AS b2b_shipping,
      (SELECT COUNT(*) FROM b2b_requests WHERE status = 'closed_won') AS b2b_won,
      (SELECT COALESCE(SUM(commission_amount), 0) FROM orders WHERE status NOT IN ('pending_payment', 'cancelled')) AS orders_commission,
      (SELECT COUNT(*) FROM b2b_requests WHERE status = 'pending_admin') AS pending_admin,
      (SELECT COUNT(*) FROM b2b_requests WHERE status = 'new') AS new_requests,
      (SELECT COUNT(*) FROM b2b_quotes WHERE status = 'submitted') AS pending_quotes,
      (SELECT COUNT(*) FROM verification_requests WHERE status = 'pending') AS pending_verifications
  `
  const pipeline = await sql`
    SELECT id, org_name, shelter_type, quantity, status, created_at
    FROM b2b_requests
    WHERE status NOT IN ('closed_won', 'closed_lost', 'cancelled', 'seller_declined')
    ORDER BY updated_at DESC
    LIMIT 8
  `
  const fmt = (v: any) => '₪' + (Number(v ?? 0) / 100).toLocaleString('he-IL')

  const waiting = [
    { label: 'עסקאות ממתינות לאישורך', count: Number(stats.pending_admin), href: '/admin/b2b', urgent: true },
    { label: 'בקשות B2B חדשות', count: Number(stats.new_requests), href: '/admin/b2b', urgent: false },
    { label: 'הצעות מחיר לאישור', count: Number(stats.pending_quotes), href: '/admin/b2b', urgent: false },
    { label: 'מוכרים ממתינים לאימות', count: Number(stats.pending_verifications), href: '/admin/sellers', urgent: false },
  ]

  return (
    <main dir="rtl" className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-navy-900">מרכז ניהול</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/b2b" className="btn-secondary text-sm">בקשות רכש B2B</Link>
          <Link href="/admin/sellers" className="btn-secondary text-sm">מוכרים</Link>
          <Link href="/admin/orders" className="btn-secondary text-sm">הזמנות</Link>
          <Link href="/admin/config" className="btn-secondary text-sm">הגדרות</Link>
        </div>
      </div>

      {/* Revenue */}
      <section>
        <h2 className="section-title mb-4">הכנסות</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'עמלות B2B', value: fmt(stats.b2b_commission) },
            { label: 'הכנסות משלוחים', value: fmt(stats.b2b_shipping) },
            { label: 'עמלות מכירות אונליין', value: fmt(stats.orders_commission) },
            { label: 'עסקאות B2B שנסגרו', value: String(stats.b2b_won) },
          ].map(s => (
            <div key={s.label} className="card p-5 text-center">
              <p className="text-2xl font-black text-brand-600">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Waiting for you */}
      <section>
        <h2 className="section-title mb-4">ממתין לך</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {waiting.map(w => (
            <Link key={w.label} href={w.href}
              className={`card p-5 flex items-center justify-between hover:shadow-card-hover transition-shadow ${w.urgent && w.count > 0 ? 'border-2 border-amber-400' : ''}`}>
              <span className="text-sm font-semibold text-navy-900">{w.label}</span>
              <span className={`text-xl font-black px-3 py-1 rounded-full ${w.count > 0 ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-400'}`}>
                {w.count}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Active pipeline */}
      <section>
        <h2 className="section-title mb-4">עסקאות פעילות</h2>
        {pipeline.length === 0 ? (
          <p className="text-gray-400">אין עסקאות פעילות כרגע</p>
        ) : (
          <div className="space-y-3">
            {pipeline.map((d: any) => (
              <Link key={d.id} href={`/admin/b2b/${d.id}`} className="block hover:opacity-90">
                <div className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-navy-900">{d.org_name ?? 'ללא שם'} — {d.shelter_type ?? ''} {d.quantity ? `× ${d.quantity}` : ''}</p>
                    <span className="text-xs text-gray-400">{new Date(d.created_at).toLocaleDateString('he-IL')}</span>
                  </div>
                  <DealProgressBar status={d.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
