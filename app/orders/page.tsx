import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'ממתין לתשלום',
  paid: 'שולם',
  shipped: 'נשלח',
  delivered: 'נמסר',
  cancelled: 'בוטל',
}

export default async function OrdersPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const supabase = createServerSupabaseClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, listings(type, length_m, width_m, height_m, price)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-3xl mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">ההזמנות שלי</h1>
      {!orders?.length && <p className="text-gray-500">אין הזמנות עדיין.</p>}
      <div className="space-y-4">
        {orders?.map(o => {
          const l = o.listings as any
          return (
            <div key={o.id} className="border rounded p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {{ mamad: 'ממד', migounit: 'מיגונית', other: 'אחר' }[l?.type as string] ?? l?.type}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {l?.length_m}×{l?.width_m}×{l?.height_m} מ'
                  </p>
                  <p className="font-bold mt-1">
                    ₪{((o.amount + o.shipping_amount) / 100).toLocaleString('he-IL')}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    o.status === 'paid' || o.status === 'delivered'
                      ? 'bg-green-100 text-green-700'
                      : o.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {STATUS_LABELS[o.status] ?? o.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
