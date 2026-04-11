import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SellerDashboard() {
  const user = await getSessionUser()
  if (!user || user.role !== 'seller') redirect('/seller/register')

  const supabase = createServerSupabaseClient()
  const [{ data: listings }, { data: orders }] = await Promise.all([
    supabase.from('listings').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
    supabase.from('orders').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
  ])

  const totalRevenue = orders
    ?.filter(o => o.status !== 'cancelled' && o.status !== 'pending_payment')
    .reduce((sum, o) => sum + o.amount - o.commission_amount, 0) ?? 0

  const activeCount  = listings?.filter(l => l.status === 'active').length ?? 0
  const ordersCount  = orders?.length ?? 0

  const STATUS_LABEL: Record<string, string> = { active: 'פעיל', sold: 'נמכר', paused: 'מושהה' }
  const STATUS_BADGE: Record<string, string> = {
    active: 'badge-active',
    sold:   'badge-sold',
    paused: 'badge-paused',
  }
  const TYPE_LABEL: Record<string, string> = { mamad: 'ממ"ד', migounit: 'מיגונית', other: 'אחר' }

  return (
    <main className="bg-gray-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-navy-900">לוח הבקרה שלי</h1>
            <p className="text-sm text-gray-500 mt-0.5">ברוך הבא, {user.name ?? 'מוכר'}</p>
          </div>
          <Link href="/seller/listings/new" className="btn-primary">
            + מוצר חדש
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Verification banner */}
        {!user.verified && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-2xl">🏅</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 text-sm">קבל תג אימות ✓ ובנה אמון עם קונים</p>
              <p className="text-xs text-amber-700 mt-0.5">מוכרים מאומתים מוכרים מהר יותר</p>
            </div>
            <Link href="/seller/verify" className="btn-secondary text-sm shrink-0 border-amber-300 text-amber-800 hover:bg-amber-50">
              בקש אימות
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'מוצרים פעילים', value: activeCount,  icon: '📦', color: 'text-brand-600' },
            { label: 'סה"כ הזמנות',   value: ordersCount,  icon: '🛒', color: 'text-green-600' },
            { label: 'הכנסות נטו',    value: `₪${(totalRevenue / 100).toLocaleString('he-IL')}`, icon: '💰', color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Listings table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-navy-900">המוצרים שלי</h2>
            <Link href="/seller/listings/new" className="text-sm text-brand-600 hover:underline font-medium">
              + הוסף מוצר
            </Link>
          </div>

          {!listings?.length ? (
            <div className="text-center py-16 text-gray-400">
              <span className="text-5xl block mb-3">📦</span>
              <p className="font-medium text-navy-700">עדיין אין מוצרים</p>
              <p className="text-sm mt-1 mb-4">פרסם את הממ&quot;ד הראשון שלך עכשיו</p>
              <Link href="/seller/listings/new" className="btn-primary inline-flex">פרסם מוצר ←</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {listings.map(l => (
                <div key={l.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-lg shrink-0">
                    🏗️
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy-900 truncate">
                      {TYPE_LABEL[l.type] ?? l.type} — {l.length_m}×{l.width_m}×{l.height_m} מ&apos;
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{l.location ?? 'ללא מיקום'}</p>
                  </div>
                  {/* Price */}
                  <p className="font-bold text-brand-600 shrink-0">
                    ₪{(l.price / 100).toLocaleString('he-IL')}
                  </p>
                  {/* Status */}
                  <span className={STATUS_BADGE[l.status] ?? 'badge bg-gray-100 text-gray-600'}>
                    {STATUS_LABEL[l.status] ?? l.status}
                  </span>
                  {/* Edit */}
                  <Link
                    href={`/seller/listings/${l.id}/edit`}
                    className="text-sm text-brand-600 hover:text-brand-800 font-medium shrink-0"
                  >
                    עריכה
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
