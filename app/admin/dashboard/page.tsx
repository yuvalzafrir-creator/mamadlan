import { requireRole } from '@/lib/auth'
import sql from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminDashboard() {
  try { await requireRole('admin') } catch { redirect('/') }

  const [sellerRows, listingRows, orderRows, pendingVrRows, buyerRows] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM users WHERE role = 'seller'`,
    sql`SELECT COUNT(*) as count FROM listings WHERE status = 'active'`,
    sql`SELECT commission_amount, amount, status, created_at FROM orders ORDER BY created_at DESC`,
    sql`SELECT COUNT(*) as count FROM verification_requests WHERE status = 'pending'`,
    sql`SELECT COUNT(*) as count FROM users WHERE role = 'buyer'`,
  ])

  const orders = orderRows as any[]
  const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'delivered')
  const totalCommission = paidOrders.reduce((s: number, o: any) => s + o.commission_amount, 0)
  const totalVolume = paidOrders.reduce((s: number, o: any) => s + o.amount, 0)
  const pendingCount = orders.filter(o => o.status === 'pending_payment').length

  const stats = [
    { label: 'מוכרים רשומים', value: sellerRows[0]?.count ?? 0, icon: '🏪', color: 'text-brand-600', href: '/admin/sellers' },
    { label: 'קונים רשומים',  value: buyerRows[0]?.count ?? 0,  icon: '🛒', color: 'text-navy-700', href: null },
    { label: 'מוצרים פעילים', value: listingRows[0]?.count ?? 0, icon: '📦', color: 'text-green-600', href: '/listings' },
    { label: 'הזמנות פתוחות', value: pendingCount, icon: '⏳', color: 'text-amber-600', href: '/admin/orders' },
    { label: 'עמלות שנגבו',   value: `₪${(totalCommission / 100).toLocaleString('he-IL')}`, icon: '💰', color: 'text-green-700', href: null },
    { label: 'מחזור עסקאות',  value: `₪${(totalVolume / 100).toLocaleString('he-IL')}`, icon: '📈', color: 'text-brand-700', href: null },
    { label: 'בקשות רכש B2B', value: '→', icon: '🏗️', color: 'text-brand-600', href: '/admin/b2b' },
  ]

  const recentOrders = orders.slice(0, 5)

  const STATUS_LABEL: Record<string, string> = {
    pending_payment: 'ממתין לתשלום',
    paid: 'שולם',
    shipped: 'נשלח',
    delivered: 'נמסר',
    cancelled: 'בוטל',
  }
  const STATUS_COLOR: Record<string, string> = {
    pending_payment: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
    shipped: 'bg-blue-100 text-blue-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const pendingVr = Number(pendingVrRows[0]?.count ?? 0)

  return (
    <main className="bg-gray-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-navy-900">לוח ניהול</h1>
            <p className="text-sm text-gray-500 mt-0.5">סקירה כללית של הפלטפורמה</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/sellers" className="btn-secondary text-sm">ניהול מוכרים</Link>
            <Link href="/admin/orders" className="btn-secondary text-sm">ניהול הזמנות</Link>
            <Link href="/admin/b2b" className="btn-secondary text-sm">בקשות רכש B2B</Link>
            <Link href="/admin/config" className="btn-primary text-sm">הגדרות</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Pending verification alert */}
        {pendingVr > 0 && (
          <Link href="/admin/sellers" className="block bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 hover:bg-amber-100 transition-colors">
            <span className="text-2xl">🏅</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 text-sm">{pendingVr} בקשות אימות ממתינות לאישור</p>
              <p className="text-xs text-amber-700 mt-0.5">לחץ לצפייה ואישור</p>
            </div>
            <span className="text-amber-600 text-sm font-semibold">לטיפול ←</span>
          </Link>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map(s => {
            const inner = (
              <div className="card p-4 flex flex-col gap-2 h-full">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">{s.icon}</div>
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              </div>
            )
            return s.href ? (
              <Link key={s.label} href={s.href} className="hover:-translate-y-0.5 transition-transform">{inner}</Link>
            ) : (
              <div key={s.label}>{inner}</div>
            )
          })}
        </div>

        {/* Recent orders */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-navy-900">הזמנות אחרונות</h2>
            <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline font-medium">כל ההזמנות ←</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="text-4xl block mb-2">📋</span>
              <p className="text-sm">אין הזמנות עדיין</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((o: any) => (
                <div key={o.id ?? Math.random()} className="px-6 py-3 flex items-center justify-between text-sm">
                  <span className="text-gray-500">{new Date(o.created_at).toLocaleDateString('he-IL')}</span>
                  <span className="font-semibold text-navy-900">₪{((o.amount) / 100).toLocaleString('he-IL')}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
