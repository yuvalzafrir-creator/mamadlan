import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SellerDashboard() {
  const user = await getSessionUser()
  if (!user || user.role !== 'seller') redirect('/seller/register')

  const supabase = createServerSupabaseClient()
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const totalRevenue =
    orders
      ?.filter(o => o.status !== 'cancelled' && o.status !== 'pending_payment')
      .reduce((sum, o) => sum + o.amount - o.commission_amount, 0) ?? 0

  return (
    <main className="max-w-4xl mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">לוח הבקרה שלי</h1>
        <Link href="/seller/listings/new" className="bg-blue-600 text-white px-4 py-2 rounded">
          + מוצר חדש
        </Link>
      </div>

      {!user.verified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
          <p className="text-yellow-800">
            קבל תג אימות ✓ ובנה אמון עם קונים.{' '}
            <Link href="/seller/verify" className="underline">בקש אימות</Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded p-4">
          <p className="text-gray-500 text-sm">מוצרים פעילים</p>
          <p className="text-2xl font-bold">{listings?.filter(l => l.status === 'active').length ?? 0}</p>
        </div>
        <div className="bg-white border rounded p-4">
          <p className="text-gray-500 text-sm">הזמנות</p>
          <p className="text-2xl font-bold">{orders?.length ?? 0}</p>
        </div>
        <div className="bg-white border rounded p-4">
          <p className="text-gray-500 text-sm">הכנסות (לאחר עמלה)</p>
          <p className="text-2xl font-bold">₪{(totalRevenue / 100).toLocaleString('he-IL')}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">המוצרים שלי</h2>
      <div className="space-y-3">
        {listings?.map(l => (
          <div key={l.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <span className="font-medium">
                {l.type === 'mamad' ? 'ממד' : l.type === 'migounit' ? 'מיגונית' : 'אחר'}
              </span>
              <span className="text-gray-500 mx-2">
                {l.length_m}×{l.width_m}×{l.height_m} מ'
              </span>
              <span className="font-bold">₪{(l.price / 100).toLocaleString('he-IL')}</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className={`text-xs px-2 py-1 rounded ${
                l.status === 'active' ? 'bg-green-100 text-green-700' :
                l.status === 'sold' ? 'bg-gray-100 text-gray-600' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {l.status === 'active' ? 'פעיל' : l.status === 'sold' ? 'נמכר' : 'מושהה'}
              </span>
              <Link href={`/seller/listings/${l.id}/edit`} className="text-blue-600 underline text-sm">
                עריכה
              </Link>
            </div>
          </div>
        ))}
        {!listings?.length && (
          <p className="text-gray-500 text-center py-8">
            עדיין אין מוצרים.{' '}
            <Link href="/seller/listings/new" className="text-blue-600 underline">פרסם את הראשון</Link>
          </p>
        )}
      </div>
    </main>
  )
}
